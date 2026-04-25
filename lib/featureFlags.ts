// UI feature toggles. NOT a security boundary — these read NEXT_PUBLIC_* env
// vars which are inlined into the browser bundle and visible to any visitor.
// For real access control on API routes, use server-only env vars (no
// NEXT_PUBLIC_ prefix), as in app/api/stats-cache/route.ts.

export function isJourneyEnabled(username?: string | null): boolean {
  if (process.env.NEXT_PUBLIC_JOURNEYS_ENABLED === "true") return true;

  const beta = (process.env.NEXT_PUBLIC_JOURNEY_BETA_USERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!username) return false;
  return beta.includes(username.toLowerCase());
}

// TEMP DIAGNOSTIC — remove after verifying journey gate works.
// In the browser DevTools console, run:  __journeyDebug()
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__journeyDebug = () => ({
    masterSwitch: process.env.NEXT_PUBLIC_JOURNEYS_ENABLED ?? "(unset)",
    betaListRaw: process.env.NEXT_PUBLIC_JOURNEY_BETA_USERS ?? "(unset)",
    betaListParsed: (process.env.NEXT_PUBLIC_JOURNEY_BETA_USERS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    note: "If betaListRaw shows '(unset)', the dev server didn't pick up .env — kill it and run `pnpm dev` again, then hard-refresh.",
  });
}
