'use client';

import React, { useEffect, useState } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Journey } from '../../types';

interface SimpleJourneyMapProps {
  journey: Journey | null;
}

export default function SimpleJourneyMap({ journey }: SimpleJourneyMapProps) {
  const [directLines, setDirectLines] = useState<Map<string, google.maps.Polyline>>(new Map());
  const map = useMap();

  // Calculate and display simple dashed polyline for all pins
  useEffect(() => {
    if (!journey || !map || !journey.pins || journey.pins.length < 2) {
      directLines.forEach(line => line.setMap(null));
      setDirectLines(new Map());
      return;
    }

    const newDirectLines = new Map<string, google.maps.Polyline>();

    // Clear old lines
    directLines.forEach(line => line.setMap(null));

    const sortedPins = [...journey.pins].sort((a, b) => a.order - b.order);

    // Draw a single connected dashed orange line
    const polyline = new google.maps.Polyline({
      path: sortedPins.map(p => p.position),
      geodesic: true,
      strokeColor: '#F97316', // Orange-500
      strokeOpacity: 0.9,
      strokeWeight: 4,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 4,
          strokeColor: '#F97316',
        },
        offset: '0',
        repeat: '20px'
      }]
    });

    polyline.setMap(map);
    newDirectLines.set('main_journey_line', polyline);

    setDirectLines(newDirectLines);
  }, [journey, map]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      directLines.forEach(line => line.setMap(null));
    };
  }, [directLines]);

  return (
    <>
      {/* Journey pins with route order numbers */}
      {journey && journey.pins
        .sort((a, b) => a.order - b.order)
        .map((pin, index) => {
          return (
            <AdvancedMarker
              key={pin.id}
              position={pin.position}
              title={`${index + 1}. ${pin.title}`}
            >
              <div className="relative">
                {/* Pin marker - Prominent Orange/White */}
                <div className="w-10 h-10 bg-orange-500 border-4 border-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>

                {/* Pin label */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 font-bold text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-100">
                  {pin.title}
                </div>
              </div>
            </AdvancedMarker>
          );
        })}
    </>
  );
}
