'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import axios from 'axios';

// Import components
import { ClusteredMarkers } from './map/ClusteredMarkers';
import { InfoWindowContent } from './map/InfoWindowContent';
import { OldLoadingSpinner } from './map/OldLoadingSpinner';
import { GetCodeButton } from './map/GetCodeButton';
import { CodeModeInterface } from './map/CodeModeInterface';
import { FloatingContextMenu } from './map/FloatingContextMenu';

// Import utilities and types
import { convertDatafromApitoGeojson } from '../utils/dataConversion';
import { InfoWindowData } from '../types';
import { initPerformanceCheck, getNetworkSpeed, isExtremelySlowConnection, isSlowConnection } from '../utils/performanceCheck';

// Global variables for location and zoom (exact copy from OLDMAPCODE)
export let setGlobalLocation: (location: google.maps.places.Place | undefined) => void;
export let setGlobalZoom: (zoom: number | undefined) => void;
export let mapZoom = 3;

// Simple map configuration
const MAP_CONFIG = {
  mapId: 'edce5dcfb5575af1',
  mapTypeId: 'roadmap'
};



export default function MapClient() {
  // Basic states
  const [geojson, setGeojson] = useState<any>(null);
  const [numClusters, setNumClusters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clustersReady, setClustersReady] = useState(false);
  const [infowindowData, setInfowindowData] = useState<InfoWindowData>(null);
  const [currentZoom, setCurrentZoom] = useState(3);
  
  // Code mode states
  const [codeMode, setCodeMode] = useState(false);
  const [codeModeMarker, setCodeModeMarker] = useState<{ lat: number; lng: number } | null>(null);
  
  // Floating context menu states
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Location and zoom states (exact copy from OLDMAPCODE)
  const [location, setLocation] = useState<google.maps.places.Place | undefined>(undefined);
  const [mylocationzoom, setMyLocationZoom] = useState<number | undefined>(undefined);
  
  // Set global functions (exact copy from OLDMAPCODE)
  setGlobalLocation = setLocation;
  setGlobalZoom = setMyLocationZoom;
  
  // Performance states
  const [performanceResult, setPerformanceResult] = useState<{
    isLowEndDevice: boolean;
    networkSpeed: number;
    isExtremelySlow: boolean;
    isSlow: boolean;
  } | null>(null);

  // API key
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Debug API key
  useEffect(() => {
    console.log('API Key status:', API_KEY ? 'Set' : 'Missing');
    if (!API_KEY) {
      console.error('Google Maps API key is missing! Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
    }
  }, [API_KEY]);

  // Map bounds
  const bounds = {
    north: 85,
    south: -85,
    west: -180,
    east: 180,
  };

  // Performance check on component mount
  useEffect(() => {
    const runPerformanceCheck = async () => {
      try {
        console.log("🔍 Starting performance check...");
        const isLowEndDevice = await initPerformanceCheck();
        const networkSpeed = getNetworkSpeed();
        const isExtremelySlow = isExtremelySlowConnection();
        const isSlow = isSlowConnection();
        
        const result = {
          isLowEndDevice,
          networkSpeed,
          isExtremelySlow,
          isSlow
        };
        
        setPerformanceResult(result);
        
        console.log("📊 Performance Check Results:");
        console.log(`   Device Type: ${isLowEndDevice ? 'Low-end' : 'High-end'}`);
        console.log(`   Network Speed: ${networkSpeed.toFixed(2)} Kbps`);
        console.log(`   Extremely Slow: ${isExtremelySlow}`);
        console.log(`   Slow Connection: ${isSlow}`);
        console.log("✅ Performance check complete!");
        
      } catch (error) {
        console.error("❌ Performance check failed:", error);
      }
    };
    
    runPerformanceCheck();
  }, []);

  // Load markers on component mount
  useEffect(() => {
    loadMarkers();
  }, []);

  // Load markers function
  async function loadMarkers(reloadExisting = false) {
    try {
      console.log('Loading markers...', reloadExisting ? '(reloading existing)' : '(initial load)');
      setLoading(true);
      setClustersReady(false);
      
      if (reloadExisting && geojson) {
        // Just reload the existing geojson data without fetching from API
        console.log('Reloading existing geolocations:', geojson.features?.length || 0, 'features');
        setGeojson(geojson);
      } else {
        // Fetch new data from API
        const response = await axios.post(`https://worldmappin.com/api/marker/0/150000/`, { curated_only: false });
        console.log('API response received:', response.data?.length || 0, 'markers');
        const geoJsonData = await convertDatafromApitoGeojson(response.data);
        console.log('GeoJSON data converted:', geoJsonData.features?.length || 0, 'features');
        setGeojson(geoJsonData);
      }
    } catch (err) {
      console.error('Error fetching feature data:', err);
    } finally {
      // Don't set loading to false here - wait for clusters to be ready
    }
  }

  // Callback to track when clusters are ready (called from ClusteredMarkers)
  const handleClustersReady = (clusterCount: number) => {
    // console.log('Clusters ready:', clusterCount);
    setClustersReady(true);
    
    // Add delay like in OLDMAPCODE (100ms delay)
    setTimeout(() => {
      setLoading(false);
    }, 100);
  };

  // Code mode functions
  const toggleCodeMode = () => {
    setCodeMode(prevMode => !prevMode);
    if (codeMode) {
      // Exiting code mode - clear marker and reload geolocations
      setCodeModeMarker(null);
      setContextMenuVisible(false);
      
      // Show loading spinner and reload existing geolocations
      setLoading(true);
      setClustersReady(false);
      
      // Reload the existing geolocations
      loadMarkers(true);
    }
  };

  const handleBackFromCodeMode = () => {
    setCodeMode(false);
    setCodeModeMarker(null);
    setContextMenuVisible(false);
    
    // Show loading spinner and reload existing geolocations
    setLoading(true);
    setClustersReady(false);
    
    // Reload the existing geolocations
    loadMarkers(true);
  };

  // Handle adding pin from context menu
  const handleAddPin = () => {
    if (pendingLocation) {
      // Set the marker and show code interface without entering full code mode
      setCodeModeMarker(pendingLocation);
      setPendingLocation(null);
    }
    setContextMenuVisible(false);
  };

  // Handle closing context menu
  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    setPendingLocation(null);
  };

  // Handle map click for code mode
  const handleMapClick = (e: any) => {
    // Allow map clicking when in code mode OR when code interface is visible
    if (codeMode || codeModeMarker) {
      const latLng = e.detail?.latLng;
      if (latLng) {
        setCodeModeMarker({ 
          lat: latLng.lat, 
          lng: latLng.lng 
        });
      }
    }
  };


  // Close tab
  const closeTab = () => {
    setInfowindowData(null);
  };

  // Expose close function globally for smooth animations
  useEffect(() => {
    (window as any).closePopup = closeTab;
  }, []);


  // State for temporary location highlight
  const [highlightedLocation, setHighlightedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Refs for custom event handling
  const mapRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Function to show temporary location highlight
  const showLocationHighlight = (position: {lat: number, lng: number}) => {
    // Validate position before setting
    if (typeof position?.lat !== 'number' || typeof position?.lng !== 'number' || 
        isNaN(position.lat) || isNaN(position.lng)) {
      console.warn('Invalid position for highlight:', position);
      return;
    }
    
    console.log('Setting highlight at:', position);
    console.log('Visual offset position (slightly lower):', { lat: position.lat - 0.0001, lng: position.lng });
    setHighlightedLocation(position);
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedLocation(null);
    }, 3000);
  };

  // Expose highlight function globally
  useEffect(() => {
    (window as any).showLocationHighlight = showLocationHighlight;
  }, []);

  // Function to convert screen coordinates to lat/lng
  const screenToLatLng = useCallback((x: number, y: number, mapElement: HTMLElement) => {
    if (!mapInstanceRef.current) {
      // Fallback to approximate calculation
      const rect = mapElement.getBoundingClientRect();
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      const lat = 50 - (relativeY / rect.height) * 100;
      const lng = 20 + (relativeX / rect.width) * 200;
      return { lat, lng };
    }

    try {
      const map = mapInstanceRef.current;
      const rect = mapElement.getBoundingClientRect();
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      
      // Use Google Maps projection to convert pixel coordinates to lat/lng
      const point = new google.maps.Point(relativeX, relativeY);
      const latLng = map.getProjection()?.fromPointToLatLng(point);
      
      if (latLng) {
        return { lat: latLng.lat(), lng: latLng.lng() };
      }
    } catch (error) {
      console.warn('Error converting coordinates:', error);
    }

    // Fallback to approximate calculation
    const rect = mapElement.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    const lat = 50 - (relativeY / rect.height) * 100;
    const lng = 20 + (relativeX / rect.width) * 200;
    return { lat, lng };
  }, []);

  // Expose global zoom functions for cluster markers (exact copy from OLDMAPCODE pattern)
  useEffect(() => {
    (window as any).setGlobalLocation = setGlobalLocation;
    (window as any).setGlobalZoom = setGlobalZoom;
    console.log('Global zoom functions set up:', { setGlobalLocation, setGlobalZoom });
  }, []);

  // Handle map idle (exact copy from OLDMAPCODE)
  const handleMapIdle = (e: any) => {
    setLocation(undefined); 
    setMyLocationZoom(undefined); 
    mapZoom = e.map.getZoom();
    setCurrentZoom(e.map.getZoom());
    // Store map instance for coordinate conversion
    mapInstanceRef.current = e.map;
  };

  // Custom event handlers for right-click and long-press
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleContextMenu = (e: MouseEvent) => {
      if (!codeMode) { // Only show context menu when NOT in code mode
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        
        // Store the click position for the context menu
        setContextMenuPosition({ x, y });
        
        // Convert screen coordinates to lat/lng using improved method
        const latLng = screenToLatLng(x, y, mapElement);
        setPendingLocation(latLng);
        setContextMenuVisible(true);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!codeMode) { // Only show context menu when NOT in code mode
        touchStartTime.current = Date.now();
        
        longPressTimer.current = setTimeout(() => {
          // Long press detected
          const touch = e.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          
          // Store the touch position for the context menu
          setContextMenuPosition({ x, y });
          
          // Convert screen coordinates to lat/lng using improved method
          const latLng = screenToLatLng(x, y, mapElement);
          setPendingLocation(latLng);
          setContextMenuVisible(true);
        }, 500); // 500ms for long press
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const handleTouchMove = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    mapElement.addEventListener('contextmenu', handleContextMenu);
    mapElement.addEventListener('touchstart', handleTouchStart);
    mapElement.addEventListener('touchend', handleTouchEnd);
    mapElement.addEventListener('touchmove', handleTouchMove);

    return () => {
      mapElement.removeEventListener('contextmenu', handleContextMenu);
      mapElement.removeEventListener('touchstart', handleTouchStart);
      mapElement.removeEventListener('touchend', handleTouchEnd);
      mapElement.removeEventListener('touchmove', handleTouchMove);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [codeMode, codeModeMarker, screenToLatLng]);


  // Show error if API key is missing
  if (!API_KEY) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Google Maps API Key Missing</h2>
          <p className="text-gray-600 mb-4">
            Please set your Google Maps API key in the <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file:
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Get your API key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version={'beta'}>
      <div className="h-screen w-full relative overflow-hidden">
        {/* Old Loading Spinner */}
        {loading && <OldLoadingSpinner message="Getting pins..." />}

        {/* Get Code Button */}
        <GetCodeButton 
          isCodeMode={codeMode} 
          onToggleCodeMode={toggleCodeMode} 
        />

        {/* Code Mode Interface - Show when in code mode OR when marker is set from context menu */}
        {(codeMode || codeModeMarker) && (
          <CodeModeInterface 
            codeModeMarker={codeModeMarker}
            onBack={codeMode ? handleBackFromCodeMode : () => setCodeModeMarker(null)}
            isFullCodeMode={codeMode}
          />
        )}

        {/* Floating Context Menu */}
        <FloatingContextMenu
          isVisible={contextMenuVisible}
          position={contextMenuPosition}
          onAddPin={handleAddPin}
          onClose={handleCloseContextMenu}
        />


        {/* Mobile Map Container */}
        <div ref={mapRef} className="map-wrapper">
            <Map
              mapId={MAP_CONFIG.mapId}
              mapTypeId={MAP_CONFIG.mapTypeId}
              defaultCenter={{ lat: 50, lng: 20 }}
              defaultZoom={1}
              minZoom={1}
              maxZoom={20}
              zoomControl={true}
              gestureHandling={'greedy'}
              disableDefaultUI={false}
              isFractionalZoomEnabled={false}
              fullscreenControl={true}
              streetViewControl={true}
              restriction={{
                latLngBounds: bounds,
                strictBounds: true,
              }}
              center={location?.location}
              zoom={location?.location ? mylocationzoom : undefined}
              onIdle={handleMapIdle}
              onClick={handleMapClick}
              className={`mobile-map-container ${(codeMode || codeModeMarker) ? 'code-mode-active' : ''}`}
            >
          {/* Clustered Markers - Show when not in full code mode */}
          {!codeMode && geojson && (
            <ClusteredMarkers
              geojson={geojson}
              setNumClusters={setNumClusters}
              setInfowindowData={setInfowindowData}
              currentZoom={currentZoom}
              onClustersReady={handleClustersReady}
            />
          )}

          {/* Code Mode Marker - Show when marker is set */}
          {codeModeMarker && (
            <AdvancedMarker position={{ lat: codeModeMarker.lat, lng: codeModeMarker.lng }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ff6b6b',
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }} />
            </AdvancedMarker>
          )}

          {/* Temporary Location Highlight - Only Pulsating Animation */}
          {highlightedLocation && 
           typeof highlightedLocation.lat === 'number' && 
           typeof highlightedLocation.lng === 'number' && 
           !isNaN(highlightedLocation.lat) && 
           !isNaN(highlightedLocation.lng) && (
            <AdvancedMarker position={{
              lat: highlightedLocation.lat, // Slightly lower position for visual offset
              lng: highlightedLocation.lng
            }}>
              <div className="location-highlight">
                {/* Multiple pulsing rings with WorldMapPin orange color */}
                <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-25" style={{animationDelay: '1s'}}></div>
                <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-10" style={{animationDelay: '1.5s'}}></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Mobile Post Popup - Bottom Sheet Style */}
          {infowindowData && (
            <div className="absolute inset-0 z-40 pointer-events-none">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                onClick={closeTab}
              ></div>
              
              {/* Bottom Sheet */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
                <div className="mobile-post-popup bg-white/95 backdrop-blur-md rounded-t-3xl shadow-2xl transform transition-all duration-300 ease-out animate-slide-up border border-white/20">
                  {/* Handle Bar */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-gray-400/60 rounded-full"></div>
                  </div>
                  
                  {/* Close Button */}
                  <button 
                    className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full flex items-center justify-center transition-colors duration-200 z-10 shadow-md border border-white/20"
                    onClick={closeTab}
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Content */}
                  <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
                    <InfoWindowContent features={infowindowData.features} />
                  </div>
                </div>
              </div>
            </div>
          )}
          </Map>
        </div>

        {/* Mobile Cluster Count - Floating Badge */}
        {/* {numClusters > 0 && (
          <div className="absolute top-4 left-4 z-30">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">{numClusters} locations</span>
              </div>
            </div>
          </div>
        )} */}

        {/* Mobile Performance Indicator - Compact */}
        {performanceResult && (
          <div className="absolute top-4 right-4 z-30">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-white/20">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  performanceResult.isExtremelySlow ? 'bg-red-500' :
                  performanceResult.isSlow ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-xs font-medium text-gray-600">
                  {performanceResult.isExtremelySlow ? 'Slow' :
                   performanceResult.isSlow ? 'Fair' : 'Fast'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}

