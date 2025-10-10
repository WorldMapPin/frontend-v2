'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Journey, JourneyState, TravelMode } from '../../types';
import { useGoogleMapsLoaded } from '../../hooks/use-google-maps-loaded';

interface SimpleJourneyMapProps {
  journey: Journey | null;
  journeyState: JourneyState;
}

// Travel mode colors
const getTravelModeColor = (travelMode: TravelMode): string => {
  switch (travelMode) {
    case 'DRIVING': return '#3B82F6'; // Blue
    case 'WALKING': return '#10B981'; // Green
    case 'BICYCLING': return '#F59E0B'; // Orange
    case 'TRANSIT': return '#8B5CF6'; // Purple
    case 'FLYING': return '#EF4444'; // Red
    default: return '#6B7280'; // Gray
  }
};

// Travel mode line styles
const getTravelModeLineStyle = (travelMode: TravelMode) => {
  switch (travelMode) {
    case 'FLYING':
      return {
        strokeColor: getTravelModeColor(travelMode),
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokePattern: [10, 5] // Dashed line for flights
      };
    default:
      return {
        strokeColor: getTravelModeColor(travelMode),
        strokeWeight: 4,
        strokeOpacity: 0.8
      };
  }
};

export default function SimpleJourneyMap({ journey, journeyState }: SimpleJourneyMapProps) {
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [segmentRenderers, setSegmentRenderers] = useState<Map<string, google.maps.DirectionsRenderer>>(new Map());
  const [directLines, setDirectLines] = useState<Map<string, google.maps.Polyline>>(new Map());
  const map = useMap();
  const isGoogleMapsLoaded = useGoogleMapsLoaded();

  // Handle map clicks to add pins in edit mode
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!journey || !journeyState.isEditMode || !event.latLng) return;

    const position = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    // Call the global function exposed by the editor
    if (typeof (window as any).addPinToCurrentJourney === 'function') {
      (window as any).addPinToCurrentJourney(position);
    }
  }, [journey, journeyState.isEditMode]);

  // Set up map click listener
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded) return;

    const listener = map.addListener('click', handleMapClick);
    
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, isGoogleMapsLoaded, handleMapClick]);

  // Initialize directions service
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded) return;

    if (!directionsService) {
      setDirectionsService(new google.maps.DirectionsService());
    }
  }, [map, isGoogleMapsLoaded, directionsService]);

  // Calculate and display individual segments
  useEffect(() => {
    if (!journey || !directionsService || !map || !journey.pins || journey.pins.length < 2) {
      // Clear all routes if no journey or insufficient pins
      segmentRenderers.forEach(renderer => renderer.setMap(null));
      setSegmentRenderers(new Map());
      directLines.forEach(line => line.setMap(null));
      setDirectLines(new Map());
      return;
    }

    const segments = journey.segments || [];
    const newRenderers = new Map<string, google.maps.DirectionsRenderer>();
    const newDirectLines = new Map<string, google.maps.Polyline>();

    // Clear old renderers and lines
    segmentRenderers.forEach(renderer => renderer.setMap(null));
    directLines.forEach(line => line.setMap(null));

    // Process each segment
    segments.forEach(segment => {
      const fromPin = journey.pins.find(p => p.id === segment.fromPinId);
      const toPin = journey.pins.find(p => p.id === segment.toPinId);
      
      if (!fromPin || !toPin) return;

      if (segment.travelMode === 'FLYING') {
        // For flights, draw a direct dashed line
        const flightPath = new google.maps.Polyline({
          path: [fromPin.position, toPin.position],
          geodesic: true,
          strokeColor: getTravelModeColor(segment.travelMode),
          strokeOpacity: 0.8,
          strokeWeight: 3,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 4
            },
            offset: '0',
            repeat: '20px'
          }]
        });
        
        flightPath.setMap(map);
        newDirectLines.set(segment.id, flightPath);
      } else {
        // For other modes, use Google Directions
        const renderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: getTravelModeLineStyle(segment.travelMode)
        });
        renderer.setMap(map);
        newRenderers.set(segment.id, renderer);

        // Get travel mode for Google Maps
        let travelMode = google.maps.TravelMode.DRIVING;
        switch (segment.travelMode) {
          case 'WALKING':
            travelMode = google.maps.TravelMode.WALKING;
            break;
          case 'BICYCLING':
            travelMode = google.maps.TravelMode.BICYCLING;
            break;
          case 'TRANSIT':
            travelMode = google.maps.TravelMode.TRANSIT;
            break;
        }

        directionsService.route({
          origin: fromPin.position,
          destination: toPin.position,
          travelMode,
          optimizeWaypoints: false
        }, (result, status) => {
          if (status === 'OK' && result) {
            renderer.setDirections(result);
          } else {
            console.warn(`Directions request failed for segment ${segment.id}:`, status);
            // Fallback to direct line
            const fallbackLine = new google.maps.Polyline({
              path: [fromPin.position, toPin.position],
              geodesic: true,
              ...getTravelModeLineStyle(segment.travelMode)
            });
            fallbackLine.setMap(map);
            newDirectLines.set(segment.id + '_fallback', fallbackLine);
          }
        });
      }
    });

    setSegmentRenderers(newRenderers);
    setDirectLines(newDirectLines);
  }, [journey, directionsService, map]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      segmentRenderers.forEach(renderer => renderer.setMap(null));
      directLines.forEach(line => line.setMap(null));
    };
  }, [segmentRenderers, directLines]);

  // Show loading state if Google Maps is not loaded yet
  if (!isGoogleMapsLoaded) {
    return (
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-3">
        <div className="text-sm text-gray-600 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Google Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Journey pins with route order numbers */}
      {journey && journey.pins
        .sort((a, b) => a.order - b.order)
        .map((pin, index) => {
          // Get pin color and icon based on type
          const getPinColor = () => {
            if (!pin.pinType) return 'bg-blue-500'; // Default old pins to blue (post style)
            switch (pin.pinType) {
              case 'post': return 'bg-blue-500';
              case 'snap': return 'bg-purple-500';
              case 'future-post': return 'bg-orange-500';
              case 'placeholder': return 'bg-green-500';
              default: return 'bg-gray-500';
            }
          };

          const getPinIcon = () => {
            if (!pin.pinType) return '📄'; // Default old pins to post icon
            switch (pin.pinType) {
              case 'post': return '📄';
              case 'snap': return '📸';
              case 'future-post': return '📝';
              case 'placeholder': return '📌';
              default: return '';
            }
          };

          return (
            <AdvancedMarker
              key={pin.id}
              position={pin.position}
              title={`${index + 1}. ${pin.title}`}
            >
              <div className="relative">
                {/* Pin marker with type-specific color */}
                <div className={`w-8 h-8 ${getPinColor()} border-3 border-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}>
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                
                {/* Pin type indicator */}
                <div className="absolute -top-1 -right-1 text-xs bg-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                  {getPinIcon()}
                </div>
                
                {/* Pin label */}
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {pin.title}
                </div>
              </div>
            </AdvancedMarker>
          );
        })}

      {/* Edit mode instructions */}
      {journeyState.isEditMode && journey && (
        <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md rounded-xl shadow-lg border border-green-200/20 p-3 max-w-xs">
          <div className="text-white text-sm">
            <div className="font-semibold mb-1">🎯 Click to Add Pins</div>
            <div className="text-green-100 text-xs">
              Click anywhere on the map to add pins to "{journey.name}"
            </div>
          </div>
        </div>
      )}

      {/* Travel Mode Legend */}
      {journey && journey.segments && journey.segments.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-3">
          <div className="text-sm">
            <div className="font-semibold mb-2 text-gray-800">Travel Modes</div>
            <div className="space-y-1">
              {Array.from(new Set(journey.segments.map(s => s.travelMode))).map(mode => (
                <div key={mode} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-1 rounded"
                    style={{ 
                      backgroundColor: getTravelModeColor(mode),
                      ...(mode === 'FLYING' ? { 
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px)'
                      } : {})
                    }}
                  ></div>
                  <span className="text-xs text-gray-700">
                    {mode === 'DRIVING' && '🚗 Driving'}
                    {mode === 'WALKING' && '🚶 Walking'}
                    {mode === 'BICYCLING' && '🚴 Bicycling'}
                    {mode === 'TRANSIT' && '🚌 Transit'}
                    {mode === 'FLYING' && '✈️ Flying'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
