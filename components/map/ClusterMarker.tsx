// Cluster marker component for displaying grouped map features
// This component renders cluster markers that represent multiple data points
// Handles click events to either expand clusters or show cluster info

import React, { useEffect, useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

// Import global state setters for map navigation
// Global functions will be available on window object
import { mapZoom } from '../MapClient';

const maxClickableCluster = 50;

type ClusterMarkerProps = {
  clusterId: number;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    clusterId: number
  ) => void;
  position: google.maps.LatLngLiteral;
  size: number;
  sizeAsText: string;
};

/**
 * Cluster marker component for grouped features
 * Renders a cluster marker that represents multiple data points
 * Handles click events to either expand the cluster or show cluster details
 * Uses different colors and sizes based on cluster size
 * 
 * @param clusterId - Unique identifier for the cluster
 * @param onMarkerClick - Callback function when cluster is clicked
 * @param position - Geographic coordinates for the cluster center
 * @param size - Number of features in the cluster
 * @param sizeAsText - Abbreviated text representation of cluster size
 */
export const ClusterMarker = ({
  position,
  size,
  sizeAsText,
  onMarkerClick,
  clusterId
}: ClusterMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  
  const handleClick = useCallback(
    () => {
      // For large clusters at low zoom levels, zoom in instead of showing details
      if (size > maxClickableCluster && (mapZoom < 14)) {        
        (window as any).setGlobalLocation?.({ location: position });
        (window as any).setGlobalZoom?.(mapZoom + 3); // Zoom in by 3 levels
      } else {
        // Show cluster details for smaller clusters or at higher zoom levels
        onMarkerClick && onMarkerClick(marker!, clusterId);
      }
    },
    [onMarkerClick, marker, clusterId, position, size]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Add a small delay to prevent double-tap issues
      setTimeout(() => {
        // For large clusters at low zoom levels, zoom in instead of showing details
        if (size > maxClickableCluster && (mapZoom < 14)) {        
          (window as any).setGlobalLocation?.({ location: position });
          (window as any).setGlobalZoom?.(mapZoom + 3); // Zoom in by 3 levels
        } else {
          // Show cluster details for smaller clusters or at higher zoom levels
          onMarkerClick && onMarkerClick(marker!, clusterId);
        }
      }, 100);
    },
    [onMarkerClick, marker, clusterId, position, size]
  );

  // Calculate marker size based on cluster size
  const markerSize = Math.floor(40 + Math.sqrt(size) / 5);

  // Determine background color based on cluster size
  let backgroundColor: string;
  if (size < 10) {
    // Warm Green to a more yellowish-green
    backgroundColor = 'linear-gradient(135deg, #76c7c0, #4b9a77)';
  } else if (size < 500) {
    // Warm Yellow to a warmer yellow-orange
    backgroundColor = 'linear-gradient(135deg, #FFEB6D, #F5B041)';
  } else if (size < 1000) {
    // Warmer Orange tones
    backgroundColor = 'linear-gradient(135deg, #FF8C42, #F57C00)';
  } else if (size < 2000) {
    // Warmer Darker Orange tones
    backgroundColor = 'linear-gradient(135deg, #F57C00, #E64A19)';
  } else {
    // Intensified Red tones
    backgroundColor = 'linear-gradient(135deg, #FF3D00, #D32F2F)';
  }

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={size}
      onClick={handleClick}
      className={'marker cluster'} 
      style={{
        width: markerSize, 
        height: markerSize, 
        background: backgroundColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        touchAction: 'manipulation' // Improve touch responsiveness
      }}
    >  
      <span 
        onTouchStart={handleTouchStart} // Add touch support for mobile
        onClick={handleClick} // Handle click events
        style={{ 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        {sizeAsText}
      </span>
    </AdvancedMarker>
  );
};
