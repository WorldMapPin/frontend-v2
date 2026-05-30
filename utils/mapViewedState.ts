// Tracks which post the user last opened from the map so that, after pressing
// Back from that post, we can highlight the cluster (or individual marker) that
// contains it with a "Viewed" badge. This mirrors the viewport persistence in
// MapClient: it is stored in sessionStorage and is only meant to be surfaced
// under the same Back/Forward navigation condition (the gating lives in
// MapClient via shouldRestoreSavedViewport, to keep this module side-effect free
// and free of circular imports).
//
// The viewed state is keyed on the stable post feature id (author/permlink
// derived) rather than a cluster id, because supercluster cluster ids are not
// stable across zoom/pan/data reloads. Cluster membership is recomputed at
// render time from this feature id.
export const VIEWED_POST_STORAGE_KEY = "wmp:map:viewedPost";

export type ViewedPost = { featureId: string; lat: number; lng: number };

export function saveViewedPost(featureId: string, lat: number, lng: number) {
  if (typeof window === "undefined") return;
  if (
    typeof featureId !== "string" ||
    featureId.length === 0 ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -85 ||
    lat > 85 ||
    lng < -180 ||
    lng > 180
  ) {
    return;
  }
  try {
    sessionStorage.setItem(
      VIEWED_POST_STORAGE_KEY,
      JSON.stringify({ featureId, lat, lng }),
    );
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function readViewedPost(): ViewedPost | null {
  if (typeof window === "undefined") return null;
  // Pure read (no side effects): callers may invoke this on every render.
  try {
    const raw = sessionStorage.getItem(VIEWED_POST_STORAGE_KEY);
    if (!raw) return null;
    const { featureId, lat, lng } = JSON.parse(raw) ?? {};
    const valid =
      typeof featureId === "string" &&
      featureId.length > 0 &&
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -85 &&
      lat <= 85 &&
      lng >= -180 &&
      lng <= 180;
    return valid ? { featureId, lat, lng } : null;
  } catch {
    return null;
  }
}
