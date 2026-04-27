// Hive post `json_metadata.canonical_url` is fully user-controlled. Rendering
// it directly as the "Open on <platform>" link's href is a phishing vector — a
// post can declare any URL and visitors who click that button leave WMP for
// an attacker-chosen page (reported 2026-04-28).
//
// Only allow URLs whose host is in a small allowlist of known Hive frontends.
// Anything else falls back to the canonical peakd.com URL we can construct
// from the trusted (author, permlink) pair.
//
// This list is deliberately scoped to text-post frontends a travel post is
// realistically published through. Verified 2026-04-28 against the Hive
// awesome-list and the @dalz Feb 2026 ranking, plus a curl of each domain.

const TRUSTED_HIVE_HOSTS = new Set<string>([
  'peakd.com',
  'www.peakd.com',
  'ecency.com',
  'www.ecency.com',
  'hive.blog',
  'www.hive.blog',
  'inleo.io',
  'www.inleo.io',
  'leofinance.io',
  'www.leofinance.io',
  'liketu.com',
  'www.liketu.com',
  'travelfeed.com',
  'www.travelfeed.com',
  'travelfeed.io',           // legacy, 308-redirects to .com — older posts still cite it
  'www.travelfeed.io',
  'worldmappin.com',
  'www.worldmappin.com',
]);

export function safeCanonicalUrl(
  rawUrl: unknown,
  author: string,
  permlink: string,
): string {
  const fallback = `https://peakd.com/@${author}/${permlink}`;
  if (typeof rawUrl !== 'string' || !rawUrl) return fallback;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return fallback;
  }

  // https only — no http, javascript:, data:, etc.
  if (parsed.protocol !== 'https:') return fallback;

  const host = parsed.hostname.toLowerCase();
  if (!TRUSTED_HIVE_HOSTS.has(host)) return fallback;

  return parsed.toString();
}
