import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ipRequestMap = new Map<string, number[]>();
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, timestamps] of ipRequestMap) {
    const filtered = timestamps.filter((t) => t > now - WINDOW_MS);
    if (filtered.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      ipRequestMap.set(ip, filtered);
    }
  }
}

function getClientIp(request: NextRequest): string {
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim());
    return parts[parts.length - 1];
  }

  return request.headers.get("x-forwarded-host") || "unknown";
}

export function middleware(request: NextRequest) {
  cleanupStaleEntries();

  const ip = getClientIp(request);
  const now = Date.now();
  const timestamps = (ipRequestMap.get(ip) || []).filter(
    (t) => t > now - WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  timestamps.push(now);
  ipRequestMap.set(ip, timestamps);

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
