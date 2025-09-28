// Custom food marker component for Foodies Bee Hive locations
// This component renders food-themed pins for food-related locations

import React, { useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import styles from './FoodMarker.module.css';

type FoodMarkerProps = {
  position: google.maps.LatLngLiteral;
  featureId: string;
  count?: number;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
};

/**
 * Food marker component for Foodies Bee Hive locations
 * Renders a custom food-themed pin with fork and knife icon
 * 
 * @param position - Geographic coordinates for the marker
 * @param featureId - Unique identifier for the feature
 * @param onMarkerClick - Callback function when marker is clicked
 */
export const FoodMarker = ({
  position,
  featureId,
  count = 1,
  onMarkerClick
}: FoodMarkerProps) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  
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
      <div 
        className={`${styles.foodMarker}`}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{ 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        {/* Food icon - cake slice */}
        <div className={styles.foodIcon}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={styles.foodSvg}
          >
            {/* Cake slice icon */}
            <path d="M12 2L8 8v12h8V8l-4-6z" />
            <path d="M8 8h8" />
            <path d="M9 10h6" />
            <path d="M10 12h4" />
            <circle cx="12" cy="6" r="1" fill="currentColor" />
            <circle cx="10" cy="4" r="0.5" fill="currentColor" />
            <circle cx="14" cy="4" r="0.5" fill="currentColor" />
          </svg>
        </div>
        
        {/* Count badge - show count if more than 1 */}
        {count > 1 && (
          <div className={styles.countBadge}>
            <span className={styles.countText}>{count}</span>
          </div>
        )}
        
        {/* Pulse animation ring */}
        <div className={styles.pulseRing}></div>
      </div>
    </AdvancedMarker>
  );
};
