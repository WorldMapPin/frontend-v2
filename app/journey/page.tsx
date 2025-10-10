'use client';

import dynamicImport from 'next/dynamic';

// Force dynamic rendering to prevent SSR issues with browser-only APIs
export const dynamic = 'force-dynamic';

// Dynamically import the map client component to prevent SSR issues
const MapClient = dynamicImport(() => import('../../components/MapClient'), {
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center">Loading journey map...</div>
});

export default function JourneyPage() {
  return <MapClient />;
}

