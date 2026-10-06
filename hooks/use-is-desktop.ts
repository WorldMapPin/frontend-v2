"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's default `lg` breakpoint (64rem = 1024px).
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True when the viewport is at least Tailwind's `lg` breakpoint.
 *
 * Use this to render *either* a mobile or a desktop variant of a component,
 * instead of rendering both and hiding one with CSS. Hidden components still
 * mount, run their effects and fire their network requests.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
