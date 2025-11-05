// Info window content component for displaying marker details
// This component fetches and displays detailed information about selected markers
// Shows post summaries with images, titles, descriptions, and metadata

import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
// Global functions will be available on window object
import { Feature, Point } from 'geojson';
import PostCardShared from '@/components/shared/PostCard';
import { fetchPosts, fetchPostsProgressive } from '@/utils/hivePosts';
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
}

/**
 * Handler for "View on Map" functionality
 * Zooms to the post location on the map
 */
const handleViewOnMap = (post: PostData) => {
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

export const InfoWindowContent = memo(({ features, showRank = true }: InfoWindowContentProps) => {
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

  if (loading) {
    if (!features.length) {
      setLoading(false);
      return null;
    }
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm">Loading posts from Hive...</p>
          {loadingProgress > 0 && (
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{loadingProgress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 text-sm font-medium">Failed to load posts</p>
        <p className="text-gray-500 text-xs mt-1">{error}</p>
      </div>
    );
  }  

  if (selectedFeatures.length > 0) {  
    return (
      <div className="space-y-4">
        {/* Mobile Header - Only shown on mobile */}
        <div className="bg-white border-b border-gray-100 pb-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Posts</h2>
              {showRank && (
                <p className="text-sm text-gray-600">{selectedFeatures.length} Pin{selectedFeatures.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
            
          </div>
        </div>
        
        {/* Posts List - Grid layout exactly like explore page */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedFeatures.map((post) => {
            // Create position object for handleViewOnMap
            const postData: PostData = {
              id: 0, // Not available from Hive data
              postLink: post.canonicalUrl || `https://peakd.com/${post.slug}`,
              postImageLink: post.coverImage || '',
              postTitle: post.title,
              postDescription: '', // Not available in ProcessedPost
              username: post.author,
              postDate: post.created,
              position: post.position,
              votes: post.votes,
              comments: post.comments,
              payout: post.payout,
              tags: post.tags
            };
            
            return (
              <PostCardShared
                key={post.slug}
                coverImage={post.coverImage}
                title={post.title}
                username={post.author}
                reputation={post.reputation}
                tags={post.tags}
                votes={post.votes}
                comments={post.comments}
                payout={post.payout}
                date={post.created}
                onClick={() => window.location.href = `/read/${post.slug}`}
                showViewOnMap={true}
                onViewOnMap={() => handleViewOnMap(postData)}
                postLink={`/read/${post.slug}`}
                position={post.position}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
});

export default InfoWindowContent;
