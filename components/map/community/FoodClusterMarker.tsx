// Food cluster marker component for Foodies Bee Hive food clusters
// This component renders food-themed cluster markers that are obviously food clusters
// Uses fork/knife and plate icons instead of generic circles

import React, { useEffect, useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

// Import global state setters for map navigation
import { mapZoom } from '../../MapClient';

const maxClickableCluster = 50;

type FoodClusterMarkerProps = {
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
 * Food cluster marker component for Foodies Bee Hive food clusters
 * Renders a food-themed cluster marker that represents multiple food locations
 * Uses fork/knife and plate icons to make it obviously a food cluster
 * 
 * @param clusterId - Unique identifier for the cluster
 * @param onMarkerClick - Callback function when cluster is clicked
 * @param position - Geographic coordinates for the cluster center
 * @param size - Number of food locations in the cluster
 * @param sizeAsText - Abbreviated text representation of cluster size
 */
export const FoodClusterMarker = ({
  position,
  size,
  sizeAsText,
  onMarkerClick,
  clusterId
}: FoodClusterMarkerProps) => {
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
  const markerSize = Math.floor(48 + Math.sqrt(size) / 4);
  const iconSize = Math.floor(20 + Math.sqrt(size) / 8);

  // Default WorldMapPin cluster colors with food theme
  let backgroundColor: string;
  let iconColor: string;
  
  if (size < 10) {
    // Warm Green to a more yellowish-green
    backgroundColor = 'linear-gradient(135deg, #76c7c0, #4b9a77)';
    iconColor = '#ffffff';
  } else if (size < 500) {
    // Warm Yellow to a warmer yellow-orange
    backgroundColor = 'linear-gradient(135deg, #FFEB6D, #F5B041)';
    iconColor = '#ffffff';
  } else if (size < 1000) {
    // Warmer Orange tones
    backgroundColor = 'linear-gradient(135deg, #FF8C42, #F57C00)';
    iconColor = '#ffffff';
  } else if (size < 2000) {
    // Warmer Darker Orange tones
    backgroundColor = 'linear-gradient(135deg, #F57C00, #E64A19)';
    iconColor = '#ffffff';
  } else {
    // Intensified Red tones
    backgroundColor = 'linear-gradient(135deg, #FF3D00, #D32F2F)';
    iconColor = '#ffffff';
  }

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={size}
      onClick={handleClick}
      className={'marker food-cluster'} 
      style={{
        width: markerSize, 
        height: markerSize, 
        background: backgroundColor,
        borderRadius: '50%', // Circular like a plate
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '11px',
        border: '3px solid white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        position: 'relative'
      }}
    >  
      <div
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{ 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        {/* Sausage/hotdog icon */}
        <svg 
          width={iconSize} 
          height={iconSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={iconColor}
          strokeWidth="2"
          style={{ marginBottom: '2px' }}
        >
          {/* Sausage/hotdog icon */}
          <ellipse cx="12" cy="12" rx="8" ry="3" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="6" ry="2" fill="white" />
          <path d="M4 12h16" />
          <path d="M8 10h8" />
          <path d="M8 14h8" />
        </svg>
        
        {/* Food location count */}
        <span style={{
          fontSize: Math.max(10, Math.min(14, markerSize / 4)) + 'px',
          fontWeight: '900',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          lineHeight: '1'
        }}>
          {sizeAsText}
        </span>
      </div>
    </AdvancedMarker>
  );
};
