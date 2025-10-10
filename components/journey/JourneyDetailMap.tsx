'use client';

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Journey, TravelMode } from '../../types';

interface JourneyDetailMapProps {
  journey: Journey;
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

// Map content component that has access to the map instance
function JourneyMapContent({ journey }: { journey: Journey }) {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [segmentRenderers, setSegmentRenderers] = useState<Record<string, any>>({});
  const [directLines, setDirectLines] = useState<Record<string, any>>({});

  // Initialize directions service
  useEffect(() => {
    if (!map) return;
    if (!directionsService) {
      setDirectionsService(new google.maps.DirectionsService());
    }
  }, [map, directionsService]);

  // Calculate and display journey segments
  useEffect(() => {
    if (!journey || !directionsService || !map || !journey.pins || journey.pins.length < 2) {
      // Clear all routes
      Object.values(segmentRenderers).forEach((renderer: any) => renderer.setMap(null));
      setSegmentRenderers({});
      Object.values(directLines).forEach((line: any) => line.setMap(null));
      setDirectLines({});
      return;
    }

    const segments = journey.segments || [];
    const newRenderers: Record<string, any> = {};
    const newDirectLines: Record<string, any> = {};

    // Clear old renderers and lines
    Object.values(segmentRenderers).forEach((renderer: any) => renderer.setMap(null));
    Object.values(directLines).forEach((line: any) => line.setMap(null));

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
        newDirectLines[segment.id] = flightPath;
      } else {
        // For other modes, use Google Directions
        const renderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: getTravelModeColor(segment.travelMode),
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
        renderer.setMap(map);
        newRenderers[segment.id] = renderer;

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

        // Request directions
        directionsService.route(
          {
            origin: fromPin.position,
            destination: toPin.position,
            travelMode: travelMode
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              renderer.setDirections(result);
            }
          }
        );
      }
    });

    setSegmentRenderers(newRenderers);
    setDirectLines(newDirectLines);

    // Cleanup on unmount
    return () => {
      Object.values(newRenderers).forEach((renderer: any) => renderer.setMap(null));
      Object.values(newDirectLines).forEach((line: any) => line.setMap(null));
    };
  }, [journey, directionsService, map]);

  const getPinColor = (pinType: string = 'placeholder') => {
    switch (pinType) {
      case 'post': return '#3B82F6'; // blue
      case 'snap': return '#A855F7'; // purple
      case 'future-post': return '#F59E0B'; // amber
      case 'placeholder': return '#6B7280'; // gray
      default: return '#3B82F6';
    }
  };

  return (
    <>
      {/* Render pins */}
      {journey.pins
        .sort((a, b) => a.order - b.order)
        .map((pin, index) => (
          <AdvancedMarker
            key={pin.id}
            position={pin.position}
            title={`${index + 1}. ${pin.title}`}
          >
            <div className="relative">
              {/* Pin marker */}
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
                style={{ backgroundColor: getPinColor(pin.pinType) }}
              >
                <span className="text-sm">{index + 1}</span>
                
                {/* Pin type indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs shadow">
                  {(!pin.pinType || pin.pinType === 'post') && '📄'}
                  {pin.pinType === 'snap' && '📸'}
                  {pin.pinType === 'future-post' && '📝'}
                  {pin.pinType === 'placeholder' && '📌'}
                </div>
              </div>

              {/* Pointer */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent"
                style={{ 
                  borderTop: `8px solid ${getPinColor(pin.pinType)}`,
                  top: '100%'
                }}
              />
            </div>
          </AdvancedMarker>
        ))}
    </>
  );
}

export default function JourneyDetailMap({ journey }: JourneyDetailMapProps) {
  // Calculate center point from all pins
  const center = React.useMemo(() => {
    if (journey.pins.length === 0) {
      return { lat: 0, lng: 0 };
    }
    
    const sum = journey.pins.reduce(
      (acc, pin) => ({
        lat: acc.lat + pin.position.lat,
        lng: acc.lng + pin.position.lng
      }),
      { lat: 0, lng: 0 }
    );
    
    return {
      lat: sum.lat / journey.pins.length,
      lng: sum.lng / journey.pins.length
    };
  }, [journey.pins]);

  // Calculate appropriate zoom level
  const zoom = React.useMemo(() => {
    if (journey.pins.length === 0) return 3;
    if (journey.pins.length === 1) return 10;

    // Calculate bounds
    const lats = journey.pins.map(p => p.position.lat);
    const lngs = journey.pins.map(p => p.position.lng);
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    // Simple zoom level calculation
    if (maxRange > 50) return 3;
    if (maxRange > 20) return 4;
    if (maxRange > 10) return 5;
    if (maxRange > 5) return 6;
    if (maxRange > 2) return 7;
    if (maxRange > 1) return 8;
    if (maxRange > 0.5) return 9;
    return 10;
  }, [journey.pins]);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        mapId="journey-detail-map"
        defaultCenter={center}
        defaultZoom={zoom}
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        gestureHandling="cooperative"
        style={{ width: '100%', height: '100%' }}
      >
        <JourneyMapContent journey={journey} />
      </Map>
    </APIProvider>
  );
}

