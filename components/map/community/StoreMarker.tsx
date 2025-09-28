// Custom store marker component for SpendHBD locations
// This component renders store-like pins for HBD spending locations

import React, { useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import styles from './StoreMarker.module.css';
import { getStoreCountColor, getStoreCountSize } from '../../../utils/coordinateGrouping';

type StoreMarkerProps = {
  position: google.maps.LatLngLiteral;
  featureId: string;
  count?: number;
  reviewCount?: number; // Add review count from Distriator API
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
};

/**
 * Store marker component for SpendHBD locations
 * Renders a custom store-like pin with shopping bag icon
 * 
 * @param position - Geographic coordinates for the marker
 * @param featureId - Unique identifier for the feature
 * @param onMarkerClick - Callback function when marker is clicked
 */
export const StoreMarker = ({
  position,
  featureId,
  count = 1,
  reviewCount = 0,
  onMarkerClick
}: StoreMarkerProps) => {
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
        className={`${styles.storeMarker} ${styles[getStoreCountSize(count)]}`}
        onTouchStart={handleTouchStart} // Add touch support for mobile
        onClick={handleClick} // Handle click events
        style={{ 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }} // Improve touch responsiveness
      >
        {/* Store building icon */}
        <div className={`${styles.storeIcon} ${styles[getStoreCountColor(reviewCount || count)]}`}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={styles.storeSvg}
          >
            {/* Store building shape */}
            <path d="M3 21h18l-1-7H4l-1 7z" />
            <path d="M4 14h16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7z" />
            <path d="M8 10h2v4H8z" />
            <path d="M14 10h2v4h-2z" />
            <path d="M10 2v4" />
            <path d="M14 2v4" />
          </svg>
        </div>
        
        {/* Count badge - show review count if available, otherwise show count */}
        <div className={`${styles.countBadge} ${styles[getStoreCountColor(reviewCount || count)]}`}>
          <span className={styles.countText}>{reviewCount || count}</span>
        </div>
        
        {/* Pulse animation ring */}
        <div className={styles.pulseRing}></div>
      </div>
    </AdvancedMarker>
  );
};
