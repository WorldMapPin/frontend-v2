'use client';

import dynamicImport from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Community } from '../../../../types';
import { COMMUNITIES } from '../../../../utils/communityApi';

// Force dynamic rendering to prevent SSR issues with browser-only APIs
export const dynamic = 'force-dynamic';

// Dynamically import the map client component to prevent SSR issues
const MapClient = dynamicImport(() => import('../../../../components/MapClient'), {
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center">Loading map...</div>
});

export default function CommunityMapPage() {
  const params = useParams();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.community) {
      const communityId = Array.isArray(params.community) 
        ? params.community[0] 
        : params.community;
      
      // Find the community by ID
      const foundCommunity = COMMUNITIES.find(c => c.id === communityId);
      
      if (foundCommunity) {
        setCommunity(foundCommunity);
      } else {
        console.error(`Community not found: ${communityId}`);
        // Fallback to default community
        setCommunity(COMMUNITIES.find(c => c.isDefault) || COMMUNITIES[0]);
      }
      
      setIsLoading(false);
    }
  }, [params?.community]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community map...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h1>
          <p className="text-gray-600 mb-4">The requested community could not be found.</p>
          <a 
            href="/map" 
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Go to Main Map
          </a>
        </div>
      </div>
    );
  }

  return (
    <MapClient 
      initialCommunity={community}
    />
  );
}
