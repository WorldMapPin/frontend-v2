import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ipRequestMap = new Map<string, number[]>();
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function generateNonce(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = String.fromCharCode(...randomBytes);
  return btoa(nonce);
}

function buildCsp(): string {
  const scriptSrcParts = [
    "'self'",
    "'unsafe-inline'",
    "https://maps.googleapis.com",
    "https://maps.gstatic.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
  ];

  if (process.env.NODE_ENV === "development") {
    scriptSrcParts.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrcParts.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.ecency.com https://files.peakd.com https://cdn.steemitimages.com https://img.leopedia.io https://img.travelfeed.io https://ui-avatars.com https://ipfs.io https://*.googleapis.com https://*.gstatic.com *.google.com *.googleusercontent.com https://*.ggpht.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.hive.blog https://worldmappin.com https://beta-api.distriator.com wss: https://*.googleapis.com *.google.com https://*.gstatic.com data: blob:",
    "frame-src *.google.com",
    "worker-src blob:",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

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
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");

  if (!isApiRoute) {
    const nonce = generateNonce();
    const csp = buildCsp();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-nonce", nonce);

    return response;
  }

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
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
