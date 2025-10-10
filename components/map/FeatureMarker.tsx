// Individual marker component for displaying single map features
// This component renders individual markers on the map and handles click events
// Used for non-clustered markers that represent single data points

import React, { useCallback } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

type FeatureMarkerProps = {
  position: google.maps.LatLngLiteral;
  featureId: string;
  onMarkerClick?: (
    marker: google.maps.marker.AdvancedMarkerElement,
    featureId: string
  ) => void;
};

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
      {/* Simple red marker pin */}
      <div 
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{ 
          width: '20px', 
          height: '20px', 
          touchAction: 'manipulation',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          background: '#ed6d28',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* White dot in center */}
        <div style={{
          width: '6px',
          height: '6px',
          background: 'white',
          borderRadius: '50%',
          transform: 'rotate(45deg)'
        }}></div>
      </div>
    </AdvancedMarker>
  );
};

