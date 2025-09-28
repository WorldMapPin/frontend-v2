'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
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
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || '',
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
};

// World bounds for map restriction
const bounds = {
  north: 85,
  south: -85,
  west: -180,
  east: 180,
};

export function UserMapComponent({ username, isExpanded }: UserMapComponentProps) {
  const [geojson, setGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [infowindowData, setInfowindowData] = useState<InfoWindowData>(null);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [userPinsCenter, setUserPinsCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [userPinsZoom, setUserPinsZoom] = useState<number>(3);

  const mapRef = useRef<HTMLDivElement>(null);

  // API key
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Fetch user-specific pins
  useEffect(() => {
    const fetchUserPinsData = async () => {
      try {
        setLoading(true);
        
        // Fetch user pins from WorldMapPin API
        const userPins: ApiPinData[] = await fetchUserPins(username);
        
        if (userPins.length === 0) {
          setGeojson({ type: "FeatureCollection", features: [] });
          setLoading(false);
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
        
        setUserPinsCenter({ lat: centerLat, lng: centerLng });
        
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
        
        setUserPinsZoom(zoom);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user pins:', error);
        setGeojson({ type: "FeatureCollection", features: [] });
        setLoading(false);
      }
    };

    if (username) {
      fetchUserPinsData();
    }
  }, [username]);

  // Handle map idle event
  const handleMapIdle = useCallback(() => {
    // Note: In the current Google Maps React implementation,
    // we can't easily access zoom from the idle event
    // This would need to be handled differently if zoom tracking is needed
  }, []);

  // Handle clusters ready
  const handleClustersReady = useCallback((clusterCount: number) => {
    // Map is ready with clusters
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
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <OldLoadingSpinner />
        </div>
      )}

      <APIProvider apiKey={API_KEY}>
        <div ref={mapRef} className="w-full h-full">
          <Map
            mapId={MAP_CONFIG.mapId}
            mapTypeId={MAP_CONFIG.mapTypeId}
            defaultCenter={userPinsCenter || { lat: 50, lng: 20 }}
            defaultZoom={userPinsCenter ? userPinsZoom : 3}
            minZoom={1}
            maxZoom={20}
            zoomControl={true}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
            isFractionalZoomEnabled={false}
            fullscreenControl={isExpanded}
            streetViewControl={true}
            restriction={{
              latLngBounds: bounds,
              strictBounds: true,
            }}
            center={userPinsCenter || undefined}
            zoom={userPinsCenter ? userPinsZoom : undefined}
            onIdle={handleMapIdle}
            className="w-full h-full"
          >
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
          </Map>
        </div>

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
      </APIProvider>

      {/* Map Stats Overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {geojson?.features?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Travel Pins</div>
        </div>
      </div>

      {/* Expand/Collapse Hint */}
      {!isExpanded && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-10">
          Click "Expand Map" for full screen view
        </div>
      )}
    </div>
  );
}

export default UserMapComponent;
