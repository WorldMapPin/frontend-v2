// Info window content component for displaying marker details
// This component fetches and displays detailed information about selected markers
// Shows post summaries with images, titles, descriptions, and metadata

import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
// Global functions will be available on window object
import { Feature, Point } from 'geojson';

// Default image for posts without images
const DEFAULT_IMAGE = '/images/no-image-found.png';

// Star Rating Component
const StarRating = ({ rating, votes }: { rating?: number; votes?: number }) => {
  if (!rating || rating === 0) return null;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <svg className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
        ))}
      </div>
      
      <span className="text-sm text-gray-600 font-medium">
        {rating.toFixed(1)}
        {votes && ` (${votes})`}
      </span>
    </div>
  );
};

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
}

// Props for individual post summary
interface PostSummaryProps {
  marker: PostData;
}

// Props for main info window content
interface InfoWindowContentProps {
  features: Feature<Point>[];
  showRank?: boolean;
}

/**
 * Individual post summary component
 * Displays a single post with image, title, description, and metadata
 * Handles image loading errors and provides fallback images
 * 
 * @param marker - Post data to display
 */
const PostSummary = ({ marker }: PostSummaryProps) => {
  const [isImageError, setIsImageError] = useState(false);

  const handleImageError = () => {
    setIsImageError(true);
  };

  const handleViewOnMap = () => {
    console.log('=== VIEW ON MAP CLICKED ===');
    console.log('Post ID:', marker.id);
    console.log('Post Title:', marker.postTitle);
    console.log('Post Position:', marker.position);
    console.log('Feature ID:', marker.featureId);
    
    // Get coordinates directly from the post
    const { lat, lng } = marker.position;
    
    if (!lat || !lng || lat === 0 || lng === 0) {
      console.error('Invalid coordinates:', { lat, lng });
      alert('Location data is not available for this post.');
      return;
    }
    
    const coordinates = { lat, lng };
    console.log('Zooming to coordinates:', coordinates);
    
    // Add visual feedback to button
    const button = document.querySelector('.view-location-btn');
    if (button) {
      button.classList.add('clicked');
      setTimeout(() => button.classList.remove('clicked'), 200);
    }
    
    // Call global map functions
    try {
      (window as any).setGlobalLocation?.({ location: coordinates });
      (window as any).setGlobalZoom?.(18);
      console.log('✅ Successfully zoomed to location');
      
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



  return (
    <div className="mobile-post-card bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-3">
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden">
        <a href={marker.postLink} target="_blank" rel="noopener noreferrer" className="block h-full">
          {!isImageError && marker.postImageLink !== "No image" ? (
            <img
              src={`https://images.ecency.com/256x512/${marker.postImageLink}`}
              alt=""
              loading="lazy"
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <img
              src={DEFAULT_IMAGE}
              alt="Default Logo"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          )}
        </a>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Post Link Icon */}
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
            <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h2 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
          <a 
            href={marker.postLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors duration-200"
          >
            {marker.postTitle}
          </a>
        </h2>
        
        {/* Description */}
        {marker.postDescription !== '<DESCRIPTION GOES HERE>' && (
          <div className="text-gray-600 text-xs leading-relaxed line-clamp-2">
            <p>{marker.postDescription}</p>
          </div>
        )}
        
        {/* Star Rating */}
        <StarRating rating={marker.rating || marker.stars || marker.score} votes={marker.votes} />
        
        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {/* User Avatar */}
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={`https://images.hive.blog/u/${marker.username}/avatar/small`}
                alt={`${marker.username}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient circle with initial if avatar fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span class="text-white text-xs font-semibold">${marker.username.charAt(0).toUpperCase()}</span>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            
            <div className="flex flex-col">
              <a 
                href={`https://peakd.com/@${marker.username}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200"
              >
                @{marker.username}
              </a>
              <span className="text-xs text-gray-500">
                {new Date(marker.postDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {/* View on Map Button */}
          <button 
            onClick={handleViewOnMap}
            className="view-location-btn px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>View on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
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
export const InfoWindowContent = memo(({ features, showRank = true }: InfoWindowContentProps) => {
  const [selectedFeatures, setSelectedFeatures] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NEW STRATEGY: Use features as source of truth, fetch post data for each feature
  const fetchFeatures = async () => {
    console.log('=== NEW STRATEGY: FEATURE-BASED APPROACH ===');
    console.log('Features received:', features);
    
    if (features.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Process each feature individually to ensure correct coordinate assignment
      const postsWithCoordinates = await Promise.all(
        features.map(async (feature, index) => {
          console.log(`Processing feature ${index}: ID ${feature.id}`);
          
          try {
            // Fetch post data for this specific feature
            const response = await axios.post("https://worldmappin.com/api/marker/ids", {
              marker_ids: [feature.id],
            });
            
            if (response.data && response.data.length > 0) {
              const postData = response.data[0];
              const [lng, lat] = feature.geometry.coordinates;
              
              console.log(`✅ Feature ${feature.id} -> Post ${postData.id} -> [${lng}, ${lat}]`);
              
              return {
                ...postData,
                position: { lat, lng },
                featureId: feature.id
              };
            } else {
              console.warn(`No post data found for feature ${feature.id}`);
              return null;
            }
          } catch (err) {
            console.error(`Error fetching post for feature ${feature.id}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and sort by date
      const validPosts = postsWithCoordinates.filter(post => post !== null);
      const sortedPosts = validPosts.sort((a: any, b: any) => {
        return new Date(b.postDate).getTime() - new Date(a.postDate).getTime();
      });
      
      console.log(`Successfully processed ${sortedPosts.length} posts with correct coordinates`);
      console.log('Final posts:', sortedPosts.map((post: any) => `${post.id}: ${post.postTitle} -> [${post.position.lat}, ${post.position.lng}]`));

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
  }, [features]);  

  if (loading) {
    if (!features.length) {
      setLoading(false);
      return null;
    }
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm">Loading posts...</p>
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
    // Posts are sorted from newest to oldest and have correct coordinates
    console.log('Rendering posts with clean coordinate matching');
    
    return (
      <div className="space-y-4">
        {/* Mobile Header - Now scrolls with content */}
        <div className="bg-white border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Posts</h2>
              {showRank && (
                <p className="text-sm text-gray-600">{selectedFeatures.length} Pin{selectedFeatures.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
            
          </div>
        </div>
        
        {/* Posts List */}
        <div className="space-y-4">
          {selectedFeatures.map((marker) => (
            <PostSummary key={marker.postLink} marker={marker} />
          ))}
        </div>
      </div>
    );
  }

  return null;
});

export default InfoWindowContent;
