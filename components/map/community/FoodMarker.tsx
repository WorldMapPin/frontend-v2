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
        {/* Food icon - fork & knife emoji */}
        <div className={styles.foodIcon}>
          <span style={{
            fontSize: '20px',
            lineHeight: '1',
            transform: 'rotate(45deg)',
            display: 'block',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}>
            🍽️
          </span>
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
