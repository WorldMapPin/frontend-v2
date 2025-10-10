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
  const markerSize = Math.floor(55 + Math.sqrt(size) / 4);
  const iconSize = Math.floor(28 + Math.sqrt(size) / 6);

  // Default WorldMapPin cluster colors with food theme
  let backgroundColor: string;
  let iconColor: string;
  let foodIcon: React.ReactNode;
  
  if (size < 10) {
    // Small clusters - Ice Cream
    backgroundColor = 'linear-gradient(135deg, #FFB8D1, #FF85A6)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🍦</span>;
  } else if (size < 50) {
    // Medium-small - Donut
    backgroundColor = 'linear-gradient(135deg, #FFD93D, #FFA726)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🍩</span>;
  } else if (size < 200) {
    // Medium - Cupcake
    backgroundColor = 'linear-gradient(135deg, #FF9999, #FF6B6B)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🧁</span>;
  } else if (size < 500) {
    // Medium-large - Pizza
    backgroundColor = 'linear-gradient(135deg, #FF8C42, #F57C00)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🍕</span>;
  } else if (size < 1000) {
    // Large - Cake
    backgroundColor = 'linear-gradient(135deg, #F57C00, #E64A19)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🎂</span>;
  } else {
    // Very large - Burger
    backgroundColor = 'linear-gradient(135deg, #FF3D00, #D32F2F)';
    iconColor = '#ffffff';
    foodIcon = <span style={{ fontSize: iconSize + 'px' }}>🍔</span>;
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
        {/* Food icon based on cluster size */}
        <div style={{ 
          marginBottom: '6px',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          lineHeight: '1'
        }}>
          {foodIcon}
        </div>
        
        {/* Food location count */}
        <span style={{
          fontSize: Math.max(11, Math.min(16, markerSize / 3.5)) + 'px',
          fontWeight: '900',
          textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(0,0,0,0.3)',
          lineHeight: '1',
          color: 'white'
        }}>
          {sizeAsText}
        </span>
      </div>
    </AdvancedMarker>
  );
};
