'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { ClusteredMarkers } from '../../../components/map/ClusteredMarkers';
import { InfoWindowContent } from '../../../components/map/InfoWindowContent';
import { OldLoadingSpinner } from '../../../components/map/OldLoadingSpinner';
import { convertDatafromApitoGeojson } from '../../../utils/dataConversion';
import { InfoWindowData } from '../../../types';
import { fetchUserPins, ApiPinData } from '../../../lib/worldmappinApi';

interface UserMapComponentProps {
  username: string;
  isExpanded: boolean;
}

// Map configuration
const MAP_CONFIG = {
  mapId: 'edce5dcfb5575af1', // Using the same Map ID as the main map
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
};

// World bounds for map restriction
const bounds = {
  north: 85,
  south: -85,
  west: -180,
  east: 180,
};

// Inner component to access map instance
function UserMapContent({ username, isExpanded, onLoad }: UserMapComponentProps & { onLoad: (loaded: boolean) => void }) {
  const map = useMap();
  const [geojson, setGeojson] = useState<any>(null);
  const [infowindowData, setInfowindowData] = useState<InfoWindowData>(null);
  const [currentZoom, setCurrentZoom] = useState(3);

  // Track zoom changes
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom) {
        setCurrentZoom(zoom);
      }
    });

    return () => listener.remove();
  }, [map]);

  // Fetch user-specific pins
  useEffect(() => {
    const fetchUserPinsData = async () => {
      try {
        onLoad(false);
        
        // Fetch user pins from WorldMapPin API
        const userPins: ApiPinData[] = await fetchUserPins(username);
        
        if (userPins.length === 0) {
          setGeojson({ type: "FeatureCollection", features: [] });
          onLoad(true);
          return;
        }

        // Convert to GeoJSON format
        const geojsonData = await convertDatafromApitoGeojson(userPins);
        setGeojson(geojsonData);

        // Calculate center point and zoom level for user's pins
        const lats = userPins.map(pin => pin.json_metadata.location.latitude);
        const lngs = userPins.map(pin => pin.json_metadata.location.longitude);
        
        const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
        const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
        
        // Calculate appropriate zoom level based on pin spread
        const latRange = Math.max(...lats) - Math.min(...lats);
        const lngRange = Math.max(...lngs) - Math.min(...lngs);
        const maxRange = Math.max(latRange, lngRange);
        
        let zoom = 10;
        if (maxRange > 50) zoom = 3;
        else if (maxRange > 20) zoom = 4;
        else if (maxRange > 10) zoom = 5;
        else if (maxRange > 5) zoom = 6;
        else if (maxRange > 1) zoom = 8;
        
        // Set map center and zoom
        if (map) {
          map.setCenter({ lat: centerLat, lng: centerLng });
          map.setZoom(zoom);
        }

        onLoad(true);
      } catch (error) {
        console.error('Error fetching user pins:', error);
        setGeojson({ type: "FeatureCollection", features: [] });
        onLoad(true);
      }
    };

    if (username && map) {
      fetchUserPinsData();
    }
  }, [username, map, onLoad]);

  // Handle clusters ready
  const handleClustersReady = useCallback((clusterCount: number) => {
    // Map is ready with clusters
  }, []);

  return (
    <>
      {/* User's Pins */}
      {geojson && geojson.features && geojson.features.length > 0 && (
        <ClusteredMarkers
          geojson={geojson}
          setNumClusters={() => {}} // Not needed for user map
          setInfowindowData={setInfowindowData}
          currentZoom={currentZoom}
          onClustersReady={handleClustersReady}
        />
      )}

      {/* Info Window */}
      {infowindowData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Pin Details</h3>
              <button
                onClick={() => setInfowindowData(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <InfoWindowContent features={infowindowData.features} />
            </div>
          </div>
        </div>
      )}

      {/* Map Stats Overlay - Smaller on mobile */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white rounded-lg shadow-lg p-2 sm:p-4 z-10">
        <div className="text-center">
          <div className="text-lg sm:text-2xl font-bold text-amber-600">
            {geojson?.features?.length || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Pins</div>
        </div>
      </div>      
    </>
  );
}

export function UserMapComponent({ username, isExpanded }: UserMapComponentProps) {
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);

  // API key
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleLoad = useCallback((loaded: boolean) => {
    setLoading(!loaded);
  }, []);


  if (!API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-gray-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={API_KEY}>
        <div ref={mapRef} className="w-full h-full">
          <Map
            mapId={MAP_CONFIG.mapId}
            mapTypeId={MAP_CONFIG.mapTypeId}
            defaultCenter={{ lat: 20, lng: 0 }}
            defaultZoom={1}
            minZoom={1}
            maxZoom={20}
            zoomControl={true}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            isFractionalZoomEnabled={false}
            fullscreenControl={isExpanded}
            streetViewControl={false}
            mapTypeControl={true}
            restriction={{
              latLngBounds: bounds,
              strictBounds: true,
            }}
            controlSize={28}
            className="w-full h-full"
          >
            <UserMapContent 
              username={username} 
              isExpanded={isExpanded}
              onLoad={handleLoad}
            />
          </Map>
        </div>
      </APIProvider>
    </div>
  );
}

export default UserMapComponent;
