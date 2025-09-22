'use client';

import dynamicImport from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Force dynamic rendering to prevent SSR issues with browser-only APIs
export const dynamic = 'force-dynamic';

// Dynamically import the map client component to prevent SSR issues
const MapClient = dynamicImport(() => import('../../../components/MapClient'), {
  ssr: false,
  loading: () => <div className="h-screen w-full flex items-center justify-center">Loading map...</div>
});

export default function CatchAllMapPage() {
  const params = useParams();
  const [username, setUsername] = useState<string>('');
  const [permlink, setPermlink] = useState<string>('');
  const [tag, setTag] = useState<string>('');

  useEffect(() => {
    if (params?.slug && Array.isArray(params.slug)) {
      const pathSegments = params.slug as string[];
      
      if (pathSegments.length === 1) {
        const segment = pathSegments[0];
        // URL decode the segment first to handle %40 (@ symbol)
        const decodedSegment = decodeURIComponent(segment);
        
        console.log('Processing segment:', { original: segment, decoded: decodedSegment });
        
        // Check if it's a username (starts with @ or %40, or doesn't contain hyphens)
        if (decodedSegment.startsWith('@') || segment.startsWith('%40')) {
          // It's a username with @ symbol (either @ or %40)
          const cleanUsername = decodedSegment.replace('@', '').replace('%40', '');
          console.log('Username with @ from URL:', { original: segment, decoded: decodedSegment, clean: cleanUsername });
          setUsername(cleanUsername);
        } else if (decodedSegment.includes('-') && !decodedSegment.includes('@') && !segment.includes('%40')) {
          // It's likely a permlink (contains hyphens but no @)
          console.log('Permlink from URL:', decodedSegment);
          setPermlink(decodedSegment);
        } else if (!decodedSegment.includes('-') && !decodedSegment.includes('@') && !segment.includes('%40')) {
          // It's a username without @ symbol
          console.log('Username without @ from URL:', decodedSegment);
          setUsername(decodedSegment);
        } else {
          // Fallback: if we can't determine the type, treat as username
          console.log('Fallback: treating as username:', { original: segment, decoded: decodedSegment });
          const cleanUsername = decodedSegment.replace('@', '').replace('%40', '');
          setUsername(cleanUsername);
        }
      } else if (pathSegments.length === 2) {
        const [type, value] = pathSegments;
        const decodedValue = decodeURIComponent(value);
        
        if (type === 'p') {
          // Handle /map/p/post-name format (new shorter format)
          console.log('Permlink from /map/p/ URL:', decodedValue);
          setPermlink(decodedValue);
        } else if (type === 'permlink') {
          // Handle /map/permlink/post-name format (legacy format)
          console.log('Permlink from /map/permlink/ URL:', decodedValue);
          setPermlink(decodedValue);
        } else if (type === 'tag') {
          console.log('Tag from structured URL:', decodedValue);
          setTag(decodedValue);
        } else if (type === 'username') {
          const cleanUsername = decodedValue.replace('@', '');
          console.log('Username from structured URL:', { original: value, decoded: decodedValue, clean: cleanUsername });
          setUsername(cleanUsername);
        }
      } else if (pathSegments.length === 3) {
        // Handle /map/tag/[tag] routes (legacy format)
        const [type, subType, value] = pathSegments;
        const decodedValue = decodeURIComponent(value);
        
        if (type === 'tag' && subType) {
          console.log('Tag from /map/tag/ URL:', decodedValue);
          setTag(decodedValue);
        }
      }
    }
  }, [params]);

  return <MapClient initialUsername={username} initialPermlink={permlink} initialTag={tag} />;
}
