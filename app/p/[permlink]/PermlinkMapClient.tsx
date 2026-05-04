"use client";

import dynamicImport from "next/dynamic";

import { MapCookieConsent } from "@/components/map/MapCookieConsent";

const MapClient = dynamicImport(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center">
      Loading map...
    </div>
  ),
});

export default function PermlinkMapClient({
  permlink,
  postPath,
}: {
  permlink: string;
  postPath: string;
}) {
  return (
    <MapCookieConsent>
      <MapClient initialPermlink={permlink} initialPermlinkPostPath={postPath} />
    </MapCookieConsent>
  );
}
