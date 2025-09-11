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
    () => onMarkerClick && onMarkerClick(marker!, featureId),
    [onMarkerClick, marker, featureId]
  );

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={handleClick}
      className={''}
    >
      {/* Original simple marker - no custom content */}
    </AdvancedMarker>
  );
};

