// Hive `posting_json_metadata.profile.website` is fully user-controlled.
// A Hive account can publish `javascript:` / `data:` / `vbscript:` URLs
// that, in browser contexts which lack the modern <a target="_blank">
// `javascript:` stripper (in-app WebViews on Twitter/Discord/Facebook/
// Instagram, older Android system WebViews), execute as same-origin
// script when the link is clicked.
//
// Mirror utils/safeCanonicalUrl.ts: https only, fail closed.

export function safeProfileUrl(input: unknown): string | null {
  if (typeof input !== 'string' || input.length === 0) return null;
  try {
    const u = new URL(input);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}
