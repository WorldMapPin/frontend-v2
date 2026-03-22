const ipRequestMap = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, timestamps] of ipRequestMap) {
    const filtered = timestamps.filter((t) => t > now - windowMs);
    if (filtered.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      ipRequestMap.set(ip, filtered);
    }
  }
}

export function rateLimit(
  ip: string,
  maxRequests = 20,
  windowMs = 60000,
): { success: boolean; remaining: number; resetAt: number } {
  cleanupStaleEntries(windowMs);

  const now = Date.now();
  const timestamps = (ipRequestMap.get(ip) || []).filter(
    (t) => t > now - windowMs,
  );

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    return {
      success: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  timestamps.push(now);
  ipRequestMap.set(ip, timestamps);

  return {
    success: true,
    remaining: maxRequests - timestamps.length,
    resetAt: now + windowMs,
  };
}

export function getClientIp(request: Request): string {
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim());
    return parts[parts.length - 1];
  }

  return "unknown";
}
