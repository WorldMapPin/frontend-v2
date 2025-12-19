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
  initialPins?: ApiPinData[];
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
function UserMapContent({ username, initialPins, isExpanded, onLoad, currentZoom }: UserMapComponentProps & { onLoad: (loaded: boolean) => void, currentZoom: number }) {
  const map = useMap();
  const [geojson, setGeojson] = useState<any>(null);
  const [infowindowData, setInfowindowData] = useState<InfoWindowData>(null);

  // Handle pin data and map setup
  useEffect(() => {
    const setupMapWithPins = async () => {
      try {
        onLoad(false);

        let userPins: ApiPinData[] = [];

        if (initialPins && initialPins.length > 0) {
          // Use pre-fetched pins if available
          userPins = initialPins;
        } else if (username && map) {
          // Fallback fetch if not provided
          userPins = await fetchUserPins(username);
        }

        if (!userPins || userPins.length === 0) {
          setGeojson({ type: "FeatureCollection", features: [] });
          // Even with no pins, we need to signal load completion
          onLoad(true);
          return;
        }

        // Convert to GeoJSON format
        const geojsonData = await convertDatafromApitoGeojson(userPins);
        setGeojson(geojsonData);

        // Robust coordinate extraction
        const coords = userPins.map(pin => {
          const lat = pin.json_metadata?.location?.latitude ?? pin.lattitude;
          const lng = pin.json_metadata?.location?.longitude ?? pin.longitude;
          return { lat: Number(lat), lng: Number(lng) };
        }).filter(c => !isNaN(c.lat) && !isNaN(c.lng));

        if (coords.length === 0) {
          setGeojson({ type: "FeatureCollection", features: [] });
          onLoad(true);
          return;
        }

        const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

        // Calculate appropriate zoom level based on pin spread
        const lats = coords.map(c => c.lat);
        const lngs = coords.map(c => c.lng);
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

        console.log(`Map initialized with ${coords.length} valid coordinates`);
        onLoad(true);
      } catch (error) {
        console.error('Error setting up user map:', error);
        setGeojson({ type: "FeatureCollection", features: [] });
        onLoad(true);
      }
    };

    if (map) {
      setupMapWithPins();
    }
  }, [username, map, initialPins, onLoad]);

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
          setNumClusters={() => { }} // Not needed for user map
          setInfowindowData={setInfowindowData}
          currentZoom={currentZoom}
          onClustersReady={handleClustersReady}
        />
      )}

      {/* Info Window */}
      {infowindowData && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold">
                {infowindowData.features.length} {infowindowData.features.length === 1 ? 'Pin' : 'Pins'}
              </h3>
              <button
                onClick={() => setInfowindowData(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <InfoWindowContent features={infowindowData.features} showRank={false} />
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

export function UserMapComponent({ username, initialPins, isExpanded }: UserMapComponentProps) {
  const [loading, setLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(3);

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
    <APIProvider apiKey={API_KEY} version={'beta'}>
      <div className="w-full h-full min-h-[400px] relative bg-gray-50 rounded-xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
              <p className="text-xs font-bold text-amber-900/40 tracking-widest uppercase">Initializing Map...</p>
            </div>
          </div>
        )}

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
          className="w-full h-full"
          onZoomChanged={(e) => {
            const zoom = e.map.getZoom();
            if (zoom) {
              setCurrentZoom(zoom);
            }
          }}
        >
          <UserMapContent
            username={username}
            initialPins={initialPins}
            isExpanded={isExpanded}
            onLoad={handleLoad}
            currentZoom={currentZoom}
          />
        </Map>
      </div>
    </APIProvider>
  );
}

export default UserMapComponent;
