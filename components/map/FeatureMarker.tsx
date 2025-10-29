// Individual marker component for displaying single map features
// This component renders individual markers on the map and handles click events
// Used for non-clustered markers that represent single data points

import React, { useCallback, useState, useEffect } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import axios from 'axios';

type FeatureMarkerProps = {
  position: google.maps.LatLngLiteral;
  featureId: string;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
};

// Global cache for marker images to avoid refetching
const markerImageCache = new Map<string, string | null>();

/**
 * Individual feature marker component
 * Renders a single marker on the map for individual data points
 * Handles click events to show info windows or trigger other actions
 * 
 * @param position - Geographic coordinates for the marker
 * @param featureId - Unique identifier for the feature
 * @param onMarkerClick - Callback function when marker is clicked
 */
export const FeatureMarker = ({
  position,
  featureId,
  onMarkerClick
}: FeatureMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [imageError, setImageError] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // Fetch cover image on mount
  useEffect(() => {
    // Check cache first
    if (markerImageCache.has(featureId)) {
      setCoverImage(markerImageCache.get(featureId) || null);
      return;
    }
    
    // Fetch post data to get image
    const fetchImage = async () => {
      try {
        const response = await axios.post("https://worldmappin.com/api/marker/ids", {
          marker_ids: [featureId],
        });
        
        if (response.data && response.data.length > 0) {
          const postData = response.data[0];
          const imageUrl = postData.postImageLink && postData.postImageLink !== "No image"
            ? `https://images.ecency.com/150x0/${postData.postImageLink}`
            : null;
          
          // Cache the result
          markerImageCache.set(featureId, imageUrl);
          setCoverImage(imageUrl);
        } else {
          markerImageCache.set(featureId, null);
        }
      } catch (err) {
        // Silently fail - just show marker without image
        markerImageCache.set(featureId, null);
      }
    };
    
    fetchImage();
  }, [featureId]);
  
  const handleClick = useCallback(
    () => {
      onMarkerClick && onMarkerClick(marker!, featureId);
    },
    [onMarkerClick, marker, featureId]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Add a small delay to prevent double-tap issues
      setTimeout(() => {
        onMarkerClick && onMarkerClick(marker!, featureId);
      }, 100);
    },
    [onMarkerClick, marker, featureId]
  );

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={handleClick}
      className={''}
    >
      {/* Enhanced marker pin with cover image */}
      <div 
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{ 
          width: '35px', 
          height: '35px', 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          background: '#ed6d28',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          border: '3px solid white',
          boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Cover image if available */}
        {coverImage && !imageError ? (
          <div style={{
            position: 'absolute',
            inset: '3px',
            transform: 'rotate(45deg)',
            transformOrigin: 'center',
            overflow: 'hidden',
            borderRadius: '50%'
          }}>
            <img
              src={coverImage}
              alt="Post"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          /* White dot in center as fallback */
          <div style={{
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%',
            transform: 'rotate(45deg)',
            zIndex: 1
          }}></div>
        )}
      </div>
    </AdvancedMarker>
  );
};

