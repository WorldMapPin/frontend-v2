// Info window content component for displaying marker details
// This component fetches and displays detailed information about selected markers
// Shows post summaries with images, titles, descriptions, and metadata

import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
// Global functions will be available on window object
import { Feature, Point } from 'geojson';
import ExploreCard from '@/components/explore/ExploreCard';
import { fetchPostsProgressive } from '@/utils/hivePosts';
import { CuratedPost, ProcessedPost } from '@/types/post';

// Post data structure from API
interface PostData {
  id: number;
  postLink: string;
  postImageLink: string;
  postTitle: string;
  postDescription: string;
  username: string;
  postDate: string;
  position: {
    lat: number;
    lng: number;
  };
  featureId?: string | number; // ID of the feature this post corresponds to
  // Star rating fields (if available from API)
  stars?: number;
  rating?: number;
  score?: number;
  votes?: number;
  comments?: number;
  payout?: string;
  tags?: string[];
}

// Props for main info window content
interface InfoWindowContentProps {
  features: Feature<Point>[];
  showRank?: boolean;
  hideHeader?: boolean;
}

// Skeleton card component that matches ExploreCard design
function SkeletonCard({ index }: { index: number }) {
  return (
    <div 
      className="rounded-xl sm:rounded-2xl overflow-visible flex flex-col relative h-full animate-pulse"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        boxShadow: '0px 4px 4px 0px var(--shadow-color)',
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Cover Image Skeleton */}
      <div className="relative w-full overflow-hidden rounded-t-xl sm:rounded-t-2xl h-[180px] sm:h-[220px] lg:h-[249.6px]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-orange-100 to-amber-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skeleton-shimmer" />
        </div>
        
        {/* Avatar and username skeleton overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/60" />
          <div className="h-3 w-20 bg-white/60 rounded" />
        </div>
        
        {/* Payout skeleton */}
        <div className="absolute top-3 right-3">
          <div className="h-4 w-12 bg-white/60 rounded" />
        </div>
      </div>

      {/* Stats badges skeleton - positioned on border */}
      <div className="absolute left-3 sm:left-4 flex flex-row gap-1.5 sm:gap-2 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
        <div className="rounded-full px-3 py-1 bg-pink-100/80 w-14 h-6" />
        <div className="rounded-full px-3 py-1 bg-blue-100/80 w-14 h-6" />
      </div>
      
      {/* Date skeleton */}
      <div className="absolute right-3 sm:right-4 z-20 top-[180px] sm:top-[220px] lg:top-[249.6px]" style={{ transform: 'translateY(-50%)' }}>
        <div className="rounded-full px-3 py-1 bg-gray-200/80 w-20 h-6" />
      </div>

      {/* Content skeleton */}
      <div className="p-3 sm:p-4 pb-3 sm:pb-4 flex flex-col flex-1 pt-5">
        <div className="space-y-2 mt-2">
          <div className="h-4 rounded w-full" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
          <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
        </div>
        
        {/* Tags skeleton */}
        <div className="mt-auto pt-3 flex gap-2">
          <div className="h-4 rounded w-14" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
          <div className="h-4 rounded w-16" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
          <div className="h-4 rounded w-12" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Handler for "View on Map" functionality
 * Zooms to the post location on the map
 */
const handleViewOnMap = (post: ProcessedPostWithCoords) => {
  // Validate position object exists
  if (!post.position || typeof post.position !== 'object') {
    alert('Location data is not available for this post.');
    return;
  }
  
  // Get coordinates directly from the post
  const { lat, lng } = post.position;
  
  // Validate coordinates are valid numbers
  if (!lat || !lng || lat === 0 || lng === 0 || isNaN(lat) || isNaN(lng)) {
    alert('Location data is not available for this post.');
    return;
  }
  
  const coordinates = { lat, lng };
  
  try {
    (window as any).setGlobalLocation?.({ location: coordinates });
    (window as any).setGlobalZoom?.(18);
    
    // Show temporary highlight at the location
    (window as any).showLocationHighlight?.(coordinates);
    
    // Close the info window smoothly after a short delay
    setTimeout(() => {
      // Trigger close animation by setting a class
      const popup = document.querySelector('.mobile-post-popup');
      if (popup) {
        popup.classList.add('slide-down');
        // Close after animation completes
        setTimeout(() => {
          (window as any).closePopup?.();
        }, 300);
      } else {
        // Fallback: close immediately if no popup found
        (window as any).closePopup?.();
      }
    }, 500); // Wait 500ms to let user see the zoom happening
    
  } catch (error) {
    console.error('Error calling map functions:', error);
    alert('Unable to zoom to location. Please try again.');
  }
};

/**
 * Main info window content component
 * Fetches detailed post data for selected markers and displays them
 * Handles loading states, errors, and sorts posts from newest to oldest
 * 
 * Clean approach: Simple coordinate matching using feature IDs to ensure each "View on Map" 
 * button links to the correct post location. Posts are sorted by postDate (newest first).
 * 
 * @param features - Array of GeoJSON features representing selected markers
 * @param showRank - Whether to show the count of loaded pins
 */
// Extended ProcessedPost with coordinates
interface ProcessedPostWithCoords extends ProcessedPost {
  position: { lat: number; lng: number };
}

export const InfoWindowContent = memo(({ features, showRank = true, hideHeader = false }: InfoWindowContentProps) => {
  const [selectedFeatures, setSelectedFeatures] = useState<ProcessedPostWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts with full Hive data (like UserPosts.tsx)
  const fetchFeatures = async () => {
    if (features.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadingProgress(0);
      
      // Step 1: Fetch basic post data from WorldMappin API to get author/permlink
      const postsWithCoordinates = await Promise.all(
        features.map(async (feature) => {
          try {
            const response = await axios.post("https://worldmappin.com/api/marker/ids", {
              marker_ids: [feature.id],
            });
            
            if (response.data && response.data.length > 0) {
              const postData = response.data[0];
              const [lng, lat] = feature.geometry.coordinates;
              
              return {
                ...postData,
                position: { lat, lng },
                featureId: feature.id,
                id: feature.id
              };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching post for feature ${feature.id}:`, err);
            return null;
          }
        })
      );

      const validPosts = postsWithCoordinates.filter(post => post !== null);
      
      if (validPosts.length === 0) {
        setLoading(false);
        return;
      }

      // Step 2: Convert to CuratedPost format for Hive fetching
      const curatedPosts: CuratedPost[] = validPosts
        .filter((post: any) => post.username && post.postLink)
        .map((post: any) => {
          // Extract author and permlink from postLink (e.g., https://peakd.com/@author/permlink)
          const urlParts = post.postLink.split('/');
          const author = post.username;
          const permlink = urlParts[urlParts.length - 1] || '';
          
          return {
            url: post.postLink,
            source: 'peakd',
            author: author.replace('@', ''),
            permlink: permlink
          };
        });

      if (curatedPosts.length === 0) {
        setError('No valid posts found');
        setLoading(false);
        return;
      }

      // Step 3: Create a map of author/permlink to coordinates
      const coordsMap = new Map<string, { lat: number; lng: number }>();
      validPosts.forEach((post: any, index: number) => {
        const author = curatedPosts[index]?.author;
        const permlink = curatedPosts[index]?.permlink;
        if (author && permlink) {
          coordsMap.set(`${author}/${permlink}`, post.position);
        }
      });

      // Step 4: Fetch full post data from Hive progressively (like UserPosts.tsx)
      const allPosts: ProcessedPostWithCoords[] = [];
      
      await fetchPostsProgressive(
        curatedPosts,
        (newPosts) => {
          // Add coordinates to each post
          const postsWithCoords = newPosts.map(post => {
            const coords = coordsMap.get(`${post.author}/${post.permlink}`) || { lat: 0, lng: 0 };
            return {
              ...post,
              position: coords
            };
          });
          allPosts.push(...postsWithCoords);
          setSelectedFeatures([...allPosts]);
          setLoadingProgress(Math.round((allPosts.length / curatedPosts.length) * 100));
        },
        10 // Concurrency
      );

      // Sort by date (newest first)
      const sortedPosts = allPosts.sort((a, b) => {
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      });

      setSelectedFeatures(sortedPosts);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching feature data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features.length]);  

  // Shimmer effect styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .skeleton-shimmer {
        animation: shimmer 1.5s infinite;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fadeInUp {
        animation: fadeInUp 0.4s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading && selectedFeatures.length === 0) {
    if (!features.length) {
      return null;
    }
    return (
      <div className="space-y-4">
        {/* Loading Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 pb-4 lg:hidden sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lexend)' }}>Loading Posts...</h2>
              {loadingProgress > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{loadingProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4 rounded-xl bg-red-50/50 border border-red-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Posts</h3>
        <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => fetchFeatures()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 hover:border-orange-200 hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      </div>
    );
  }  

  if (selectedFeatures.length > 0) {  
    return (
      <div className="space-y-6">
        {/* Header Section - Polished design matching Explore page */}
        {!hideHeader && (
          <div className="bg-white/50 backdrop-blur-sm border-b border-gray-100 pb-5 mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-lexend)' }}>
                    Discover Posts
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                      {selectedFeatures.length} {selectedFeatures.length === 1 ? 'Adventure' : 'Adventures'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">found at this location</span>
                  </div>
                </div>
              </div>
              
              {/* Sort/Filter info (can be expanded later) */}
              <div className="hidden sm:block">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  Sorted by Latest
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Posts Grid - Grid layout matching explore page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {selectedFeatures.map((post, index) => (
            <div 
              key={`${post.slug}-${index}`}
              className="animate-fadeInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ExploreCard
                post={post}
                showViewOnMap={true}
                onViewOnMap={() => handleViewOnMap(post)}
              />
            </div>
          ))}
          
          {/* Show skeletons if still loading more (progressive loading) */}
          {loading && [...Array(3)].map((_, index) => (
            <SkeletonCard key={`loading-more-${index}`} index={index} />
          ))}
        </div>
        
        {/* Footer / Status */}
        {!loading && (
          <div className="text-center pt-10 pb-4">
            <div className="inline-flex flex-col items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400/30 animate-pulse"></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">End of Collection</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
});

export default InfoWindowContent;
