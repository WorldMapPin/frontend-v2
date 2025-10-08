'use client';

import React, { useEffect, useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { fetchUserPostsWithCoords, ApiPinData } from '../../lib/worldmappinApi';

interface UserPostsOnMapProps {
  username: string;
  onPostClick: (post: ApiPinData) => void;
  selectedPostId?: number | null;
}

export default function UserPostsOnMap({ username, onPostClick, selectedPostId }: UserPostsOnMapProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        
        // Fetch posts with coordinates in one optimized call
        const posts = await fetchUserPostsWithCoords(username);
        
        console.log('UserPostsOnMap: Displaying', posts.length, 'posts on map');
        setPosts(posts);
      } catch (error) {
        console.error('UserPostsOnMap: Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [username]);

  if (loading || posts.length === 0) return null;

  return (
    <>
      {posts.map(post => {
        const isSelected = selectedPostId === post.id;
        
        return (
          <AdvancedMarker
            key={post.id}
            position={{
              lat: post.lattitude, // API uses 'lattitude' with typo
              lng: post.longitude
            }}
            onClick={() => onPostClick(post)}
          >
            {/* Standard WorldMapPin pin style with selection highlighting */}
            <div style={{
              position: 'relative',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Pulse ring for selected pin */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%',
                  opacity: 0.4,
                  animation: 'pulse 1.5s ease-out infinite'
                }} />
              )}
              {/* Main pin */}
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: isSelected ? '#3B82F6' : '#F59E0B',
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.2)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: isSelected ? 10 : 1
              }} />
            </div>
            <style>{`
              @keyframes pulse {
                0% {
                  transform: scale(1);
                  opacity: 0.4;
                }
                50% {
                  transform: scale(1.5);
                  opacity: 0.2;
                }
                100% {
                  transform: scale(2);
                  opacity: 0;
                }
              }
            `}</style>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

