// Store cluster marker component for SpendHBD store clusters
// This component renders store-themed cluster markers that are obviously store clusters
// Uses shopping bag/store building icons instead of generic circles

import React, { useEffect, useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

// Import global state setters for map navigation
import { mapZoom } from '../../MapClient';

const maxClickableCluster = 50;

type StoreClusterMarkerProps = {
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
 * Store cluster marker component for SpendHBD store clusters
 * Renders a store-themed cluster marker that represents multiple stores
 * Uses shopping bag/store building icons to make it obviously a store cluster
 * 
 * @param clusterId - Unique identifier for the cluster
 * @param onMarkerClick - Callback function when cluster is clicked
 * @param position - Geographic coordinates for the cluster center
 * @param size - Number of stores in the cluster
 * @param sizeAsText - Abbreviated text representation of cluster size
 */
export const StoreClusterMarker = ({
  position,
  size,
  sizeAsText,
  onMarkerClick,
  clusterId
}: StoreClusterMarkerProps) => {
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

  // Store cluster colors - different from single stores for better distinction
  let backgroundColor: string;
  let iconColor: string;
  
  if (size < 10) {
    backgroundColor = 'linear-gradient(135deg, #06b6d4, #0891b2)'; // Cyan for small store clusters
    iconColor = '#ffffff';
  } else if (size < 50) {
    backgroundColor = 'linear-gradient(135deg, #84cc16, #65a30d)'; // Lime for medium store clusters
    iconColor = '#ffffff';
  } else if (size < 200) {
    backgroundColor = 'linear-gradient(135deg, #f97316, #ea580c)'; // Orange for large store clusters
    iconColor = '#ffffff';
  } else if (size < 500) {
    backgroundColor = 'linear-gradient(135deg, #dc2626, #b91c1c)'; // Red for very large store clusters
    iconColor = '#ffffff';
  } else {
    backgroundColor = 'linear-gradient(135deg, #9333ea, #7c3aed)'; // Violet for massive store clusters
    iconColor = '#ffffff';
  }

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={size}
      onClick={handleClick}
      className={'marker store-cluster'} 
      style={{
        width: markerSize, 
        height: markerSize, 
        background: backgroundColor,
        borderRadius: '12px', // More rectangular like a store building
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
        {/* Store building icon */}
        <svg 
          width={iconSize} 
          height={iconSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={iconColor}
          strokeWidth="2"
          style={{ marginBottom: '2px' }}
        >
          {/* Store building shape */}
          <path d="M3 21h18l-1-7H4l-1 7z" />
          <path d="M4 14h16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7z" />
          <path d="M8 10h2v4H8z" />
          <path d="M14 10h2v4h-2z" />
          <path d="M10 2v4" />
          <path d="M14 2v4" />
        </svg>
        
        {/* Store count */}
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
