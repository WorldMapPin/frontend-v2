'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import axios from 'axios';

// Import components
import { ClusteredMarkers } from '@/components/map/ClusteredMarkers';
import { InfoWindowContent } from '@/components/map/InfoWindowContent';
import { SpendHBDInfoWindow } from '@/components/map/community/SpendHBDInfoWindow';
import { SpendHBDClusterInfo } from '@/components/map/community/SpendHBDClusterInfo';
import { OldLoadingSpinner } from '@/components/map/OldLoadingSpinner';
import { GetCodeButton } from '@/components/map/GetCodeButton';
import { CodeModeInterface } from '@/components/map/CodeModeInterface';
import { FloatingContextMenu } from '@/components/map/FloatingContextMenu';
import FilterComponent from '@/components/map/FilterComponent';
import CommunitySelector from '@/components/map/community/CommunitySelector';
import MapFilterBar from '@/components/map/MapFilterBar';

// Import journey components
import SimpleJourneyEditor from '@/components/journey/SimpleJourneyEditor';
import SimpleJourneyMap from '@/components/journey/SimpleJourneyMap';
import UserPostsOnMap from '@/components/journey/UserPostsOnMap';

// Import utilities and types
import { convertDatafromApitoGeojson } from '../utils/dataConversion';
import { InfoWindowData, SearchParams, Community, Journey, JourneyState } from '../types';
import { Feature, Point } from 'geojson';
import { initPerformanceCheck, getNetworkSpeed, isExtremelySlowConnection, isSlowConnection } from '../utils/performanceCheck';
import { fetchCommunityPins, COMMUNITIES, getDefaultCommunity } from '../utils/communityApi';

// Global variables for zoom (local to this module)
export let mapZoom = 2; // Start at zoom 2, skip 3

// Simple map configuration
const MAP_CONFIG = {
  mapId: 'edce5dcfb5575af1',
  mapTypeId: 'roadmap'
};



interface MapClientProps {
  initialUsername?: string;
  initialPermlink?: string;
  initialTag?: string;
  initialCommunity?: Community;
}

export default function MapClient({ initialUsername, initialPermlink, initialTag, initialCommunity }: MapClientProps = {}) {
  // Basic states
  const [geojson, setGeojson] = useState<any>(null);
  const [numClusters, setNumClusters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clustersReady, setClustersReady] = useState(false);
  const [infowindowData, setInfowindowData] = useState<InfoWindowData>(null);
  const [currentZoom, setCurrentZoom] = useState(2); // Start at 2, skip 3
  const previousZoomRef = React.useRef(2); // Track previous zoom for direction detection

  // Code mode states
  const [codeMode, setCodeMode] = useState(false);
  const [codeModeMarker, setCodeModeMarker] = useState<{ lat: number; lng: number } | null>(null);

  // Floating context menu states
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Location and zoom states
  const [location, setLocation] = useState<google.maps.places.Place | undefined>(undefined);
  const [mylocationzoom, setMyLocationZoom] = useState<number | undefined>(undefined);


  // Function to zoom to specific coordinates
  const handleViewOnMap = (coordinates: [number, number]) => {
    const [lng, lat] = coordinates;
    setLocation({
      location: { lat, lng },
      name: 'Store Location'
    } as unknown as google.maps.places.Place);
    setMyLocationZoom(18); // Higher zoom level for better store highlighting
  };

  // Performance states
  const [performanceResult, setPerformanceResult] = useState<{
    isLowEndDevice: boolean;
    networkSpeed: number;
    isExtremelySlow: boolean;
    isSlow: boolean;
  } | null>(null);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    if (initialUsername) {
      return { author: initialUsername };
    } else if (initialPermlink) {
      return { permlink: initialPermlink };
    } else if (initialTag) {
      return { tags: [initialTag] };
    }
    return { curated_only: false };
  });

  // Community states
  const [selectedCommunity, setSelectedCommunity] = useState<Community>(initialCommunity || getDefaultCommunity());
  const [showCommunitySelector, setShowCommunitySelector] = useState(false);
  const [originalClusterFeatures, setOriginalClusterFeatures] = useState<Feature<Point>[] | null>(null);
  const [loadedCommunity, setLoadedCommunity] = useState<Community>(initialCommunity || getDefaultCommunity());
  const [showCommunityHeader, setShowCommunityHeader] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<string>(MAP_CONFIG.mapTypeId);

  // Journey states
  const [journeyState, setJourneyState] = useState<JourneyState>({
    journeys: [],
    currentJourney: null,
    editableUsers: [],
    activeUser: '',
    isEditMode: false
  });
  const [showJourneyControls, setShowJourneyControls] = useState(false);
  const [authStateKey, setAuthStateKey] = useState(0); // Track auth changes to force remount
  const [showUserPostsOnMap, setShowUserPostsOnMap] = useState(false);
  const [userPostsUsername, setUserPostsUsername] = useState<string>('');
  const [onUserPostClick, setOnUserPostClick] = useState<((post: any) => void) | null>(null);
  const [selectedStartingPostId, setSelectedStartingPostId] = useState<number | null>(null);

  // API key
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Debug API key
  useEffect(() => {
    console.log('API Key status:', API_KEY ? 'Set' : 'Missing');
    if (!API_KEY) {
      console.error('Google Maps API key is missing! Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
    }
  }, [API_KEY]);

  // Listen for auth changes to force SimpleJourneyEditor remount
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthStateKey(prev => prev + 1);
    };

    window.addEventListener('hive-auth-state-change', handleAuthChange);
    return () => window.removeEventListener('hive-auth-state-change', handleAuthChange);
  }, []);

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

  // Auto-load community pins if initialCommunity is provided
  useEffect(() => {
    if (initialCommunity) {
      console.log('Auto-loading community pins for:', initialCommunity.name);
      // Set loading state and load markers for the initial community
      setLoading(true);
      setClustersReady(false);
      loadMarkers(false, searchParams, initialCommunity);

      // Fallback timeout in case clusters never load (10 seconds)
      setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      }, 10000);
    }
  }, [initialCommunity]);

  // Load markers on component mount - only for default community
  useEffect(() => {
    if (selectedCommunity.isDefault && !initialCommunity) {
      loadMarkers(false, searchParams);
    }
  }, []);

  // Listen for center-map-on-pin events from journey editor
  useEffect(() => {
    const handleCenterMapOnPin = (event: CustomEvent) => {
      const { lat, lng, zoom } = event.detail;
      setLocation({
        location: { lat, lng },
        name: 'Pin Location'
      } as unknown as google.maps.places.Place);
      setMyLocationZoom(zoom || 15);
    };

    window.addEventListener('center-map-on-pin' as any, handleCenterMapOnPin);

    return () => {
      window.removeEventListener('center-map-on-pin' as any, handleCenterMapOnPin);
    };
  }, []);

  // Load markers function
  async function loadMarkers(reloadExisting = false, filterParams?: SearchParams, community?: Community) {
    try {
      const targetCommunity = community || selectedCommunity;

      // Only set loading state if not already set (to avoid overriding handleLoadPins)
      if (!loading) {
        setLoading(true);
      }
      setClustersReady(false);

      if (reloadExisting && geojson) {
        // Just reload the existing geojson data without fetching from API
        setGeojson(geojson);
      } else {
        // Fetch new data from community API
        const params = filterParams || searchParams;

        let geoJsonData;
        if (targetCommunity.isDefault) {
          // Use the original WorldMapPin API for default community
          const response = await axios.post(`https://worldmappin.com/api/marker/0/150000/`, params);
          geoJsonData = await convertDatafromApitoGeojson(response.data);
        } else {
          // Use community-specific API
          geoJsonData = await fetchCommunityPins(targetCommunity);
        }

        setGeojson(geoJsonData);
        setLoadedCommunity(targetCommunity); // Set the community that actually has loaded pins
      }
    } catch (err) {
      console.error('Error fetching feature data:', err);
    } finally {
      // Don't set loading to false here - wait for clusters to be ready
    }
  }

  // Callback to track when clusters are ready (called from ClusteredMarkers)
  const handleClustersReady = (clusterCount: number) => {
    // Only stop loading if we have actual clusters (not empty data)
    if (clusterCount > 0) {
      setClustersReady(true);

      // Add delay like in OLDMAPCODE (100ms delay)
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
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

  // Handle starting journey from context menu
  const handleStartJourney = () => {
    if (pendingLocation) {
      console.log('Starting journey at:', pendingLocation);
      // Functionality to be implemented later
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
    // But not when journey edit mode is active
    if ((codeMode || codeModeMarker) && !journeyState.isEditMode) {
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
    setOriginalClusterFeatures(null);
  };

  // Community handling functions
  const handleCommunityChange = (community: Community) => {
    setSelectedCommunity(community);
    // Hide community header when switching communities
    setShowCommunityHeader(false);
    // Don't auto-load markers - user needs to click "Load Pins" button
  };

  const handleLoadPins = (community: Community) => {
    setSelectedCommunity(community);
    setClustersReady(false);
    setLoading(true);

    // Show community header image for specific communities
    if (community.id === 'spendhbd' || community.id === 'foodie') {
      setShowCommunityHeader(true);
    }

    // Clear existing data and load new markers
    setGeojson({ type: "FeatureCollection", features: [] });
    loadMarkers(false, searchParams, community);

    // Fallback timeout in case clusters never load (10 seconds)
    setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);
  };

  // Handle store selection from cluster
  const handleStoreSelect = (store: any) => {
    // Store the original cluster features for back navigation
    if (infowindowData?.features) {
      setOriginalClusterFeatures(infowindowData.features);
    }

    // Show the selected store's posts
    setInfowindowData({
      anchor: infowindowData?.anchor || null as any,
      features: store.features,
      isCluster: false
    });
  };

  // Handle back to cluster view
  const handleBackToCluster = () => {
    if (infowindowData && originalClusterFeatures) {
      setInfowindowData({
        ...infowindowData,
        features: originalClusterFeatures,
        isCluster: true
      });
    }
  };

  // Filter handling functions
  const handleFilter = (filterData: any) => {
    if (filterData) {
      const newSearchParams: SearchParams = {
        tags: filterData.tags && filterData.tags.length > 0 ? filterData.tags : [],
        author: filterData.username || '',
        post_title: filterData.postTitle || '',
        permlink: filterData.permlink || '',
        start_date: filterData.startDate || '',
        end_date: filterData.endDate || '',
        curated_only: filterData.isCurated || false
      };

      setSearchParams(newSearchParams);
      loadMarkers(false, newSearchParams, selectedCommunity);
    } else {
      // Clear filter
      const clearedParams: SearchParams = { curated_only: false };
      setSearchParams(clearedParams);
      loadMarkers(false, clearedParams, selectedCommunity);
    }
    setShowFilter(false);
  };

  const handleTagChange = (tags: string) => {
    // Handle any special tag change logic if needed
    console.log('Tags changed:', tags);
  };

  // Journey handling functions
  const handleJourneyChange = useCallback((journey: Journey | null) => {
    setJourneyState(prev => ({ ...prev, currentJourney: journey }));
  }, []);

  const handleJourneyStateChange = useCallback((newState: JourneyState) => {
    setJourneyState(newState);
  }, []);

  const handleShowUserPosts = useCallback((username: string, postClickHandler: (post: any) => void) => {
    setShowUserPostsOnMap(true);
    setUserPostsUsername(username);
    setSelectedStartingPostId(null); // Reset selection
    // Wrap the post click handler to also track the selected post ID
    setOnUserPostClick(() => (post: any) => {
      setSelectedStartingPostId(post.id);
      postClickHandler(post);
    });
  }, []);

  // Listen for hide user posts event
  useEffect(() => {
    const handleHideUserPosts = () => {
      setShowUserPostsOnMap(false);
      setUserPostsUsername('');
      setOnUserPostClick(null);
      setSelectedStartingPostId(null);
    };

    window.addEventListener('hide-user-posts-on-map', handleHideUserPosts);
    return () => window.removeEventListener('hide-user-posts-on-map', handleHideUserPosts);
  }, []);

  // Map control functions
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 2;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 2;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const handleToggleMapType = () => {
    const nextType = mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap';
    setMapTypeId(nextType);
  };

  // Simplified journey handling - no complex callbacks needed

  // Expose close function globally for smooth animations
  useEffect(() => {
    (window as any).closePopup = closeTab;
  }, []);


  // State for temporary location highlight
  const [highlightedLocation, setHighlightedLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Refs for custom event handling
  const mapRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartTime = useRef<number>(0);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Function to show temporary location highlight
  const showLocationHighlight = (position: { lat: number, lng: number }) => {
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

  // Expose global zoom functions for cluster markers via events
  useEffect(() => {
    const handleSetLocation = (e: any) => {
      const data = e.detail;
      if (data) {
        setLocation(data);
      } else {
        setLocation(undefined);
      }
    };

    const handleSetZoom = (e: any) => {
      const zoom = e.detail;
      if (typeof zoom === 'number') {
        setMyLocationZoom(zoom);
      }
    };

    const handleToggleCodeModeEvent = () => {
      toggleCodeMode();
    };

    window.addEventListener('map-set-location', handleSetLocation);
    window.addEventListener('map-set-zoom', handleSetZoom);
    window.addEventListener('map-toggle-code-mode', handleToggleCodeModeEvent);

    return () => {
      window.removeEventListener('map-set-location', handleSetLocation);
      window.removeEventListener('map-set-zoom', handleSetZoom);
      window.removeEventListener('map-toggle-code-mode', handleToggleCodeModeEvent);
    };
  }, []);

  // Handle map idle
  const handleMapIdle = (e: any) => {
    setLocation(undefined);
    setMyLocationZoom(undefined);

    const newZoom = e.map.getZoom();

    // Skip zoom level 3 - jump to 2 or 4 depending on direction
    if (newZoom === 3) {
      const previousZoom = previousZoomRef.current;
      if (previousZoom < 3) {
        // Zooming in from 2 → skip to 4
        e.map.setZoom(4);
        mapZoom = 4;
        setCurrentZoom(4);
        previousZoomRef.current = 4;
      } else {
        // Zooming out from 4+ → skip to 2
        e.map.setZoom(2);
        mapZoom = 2;
        setCurrentZoom(2);
        previousZoomRef.current = 2;
      }
    } else {
      mapZoom = newZoom;
      setCurrentZoom(newZoom);
      previousZoomRef.current = newZoom;
    }

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
      <div className="h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] w-full relative overflow-hidden font-lexend">
        {/* Old Loading Spinner */}
        {loading && <OldLoadingSpinner message={`Loading ${selectedCommunity.name} pins...`} />}


        {/* Filter Banners */}
        {/* Username Filter Banner */}
        {searchParams.author && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
            <div className="bg-orange-500/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-orange-300/30 transition-all duration-200 flex items-center space-x-2 max-w-[90vw] md:max-w-md">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                <Image
                  src={`https://images.hive.blog/u/${searchParams.author}/avatar`}
                  alt={`@${searchParams.author}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-avatar.svg';
                  }}
                />
              </div>
              <span className="text-sm font-medium text-white truncate">
                @{searchParams.author}
              </span>
              <button
                onClick={() => {
                  setSearchParams({ curated_only: false });
                  loadMarkers(false, { curated_only: false });
                }}
                className="w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-1"
                aria-label="Clear filter"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Permlink Filter Banner */}
        {searchParams.permlink && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
            <div className="bg-blue-500/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-blue-300/30 transition-all duration-200 flex items-center space-x-2 max-w-[90vw] md:max-w-md">
              <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm font-medium text-white truncate">
                {searchParams.permlink}
              </span>
              <button
                onClick={() => {
                  setSearchParams({ curated_only: false });
                  loadMarkers(false, { curated_only: false });
                }}
                className="w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-1"
                aria-label="Clear filter"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tag Filter Banner */}
        {searchParams.tags && searchParams.tags.length > 0 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
            <div className="bg-green-500/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-green-300/30 transition-all duration-200 flex items-center space-x-2 max-w-[90vw] md:max-w-md">
              <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-medium text-white truncate">
                {searchParams.tags.join(', ')}
              </span>
              <button
                onClick={() => {
                  setSearchParams({ curated_only: false });
                  loadMarkers(false, { curated_only: false });
                }}
                className="w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-1"
                aria-label="Clear filter"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Community Header Image */}
        {showCommunityHeader && loadedCommunity && (
          <div className="absolute z-25 top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-2 max-w-sm relative">
              {/* Close button */}
              <button
                onClick={() => setShowCommunityHeader(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 z-10"
              >
                ×
              </button>

              {loadedCommunity.id === 'spendhbd' && (
                <img
                  src="/images/WMP-x-Distriator.jpg"
                  alt="SpendHBD Community Header"
                  className="w-full h-auto max-h-32 object-contain rounded-xl"
                />
              )}
              {loadedCommunity.id === 'foodie' && (
                <img
                  src="/images/wmp-x-foodie-bee-hive.png"
                  alt="Foodies Bee Hive Community Header"
                  className="w-full h-auto max-h-32 object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        )}


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
          onStartJourney={handleStartJourney}
          onClose={handleCloseContextMenu}
        />

        {/* New Map Filter Bar */}
        <MapFilterBar
          onFilter={handleFilter}
          searchParams={searchParams}
          onToggleJourneys={() => setShowJourneyControls(!showJourneyControls)}
          showJourneys={showJourneyControls}
          onToggleCodeMode={toggleCodeMode}
          isCodeMode={codeMode}
          onOpenCommunitySelector={() => setShowCommunitySelector(true)}
          selectedCommunityName={selectedCommunity.name}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onToggleMapType={handleToggleMapType}
          mapTypeId={mapTypeId}
        />

        {/* Community Selector Component */}
        <CommunitySelector
          communities={COMMUNITIES}
          selectedCommunity={selectedCommunity}
          onCommunityChange={handleCommunityChange}
          onLoadPins={handleLoadPins}
          isVisible={showCommunitySelector}
          onClose={() => setShowCommunitySelector(false)}
        />

        {/* Journey Editor */}
        {showJourneyControls && (
          <SimpleJourneyEditor
            key={`journey-editor-${authStateKey}`}
            onJourneyChange={handleJourneyChange}
            onStateChange={handleJourneyStateChange}
            onShowUserPosts={handleShowUserPosts}
          />
        )}


        {/* Mobile Map Container */}
        <div ref={mapRef} className="map-wrapper">
          <Map
            mapId={MAP_CONFIG.mapId}
            mapTypeId={mapTypeId}
            defaultCenter={{ lat: 50, lng: 20 }}
            defaultZoom={2}
            minZoom={2}
            maxZoom={20}
            zoomControl={false}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            isFractionalZoomEnabled={false}
            fullscreenControl={false}
            streetViewControl={false}
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
            {/* Clustered Markers - Show when not in full code mode and journey controls are hidden */}
            {!codeMode && !showJourneyControls && geojson && (
              <ClusteredMarkers
                key={`${loadedCommunity?.id}-${geojson.features?.length || 0}`}
                geojson={geojson}
                setNumClusters={setNumClusters}
                setInfowindowData={setInfowindowData}
                currentZoom={currentZoom}
                onClustersReady={handleClustersReady}
                community={loadedCommunity}
              />
            )}

            {/* Simple Journey Map - Show when journey controls are visible */}
            {showJourneyControls && !showUserPostsOnMap && (
              <SimpleJourneyMap
                journey={journeyState.currentJourney}
                journeyState={journeyState}
              />
            )}

            {/* User Posts on Map - Show when selecting starting post */}
            {showUserPostsOnMap && userPostsUsername && onUserPostClick && (
              <UserPostsOnMap
                username={userPostsUsername}
                onPostClick={onUserPostClick}
                selectedPostId={selectedStartingPostId}
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
                  lat: highlightedLocation.lat,
                  lng: highlightedLocation.lng
                }}>
                  <div className="location-highlight">
                    {/* Multiple pulsing rings with WorldMapPin orange color */}
                    <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute inset-0 w-12 h-12 bg-orange-500 rounded-full animate-ping opacity-10" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </AdvancedMarker>
              )}

            {/* Post Popup - Responsive: Bottom Sheet (Mobile) / Centered Modal (Desktop) */}
            {infowindowData && (
              <div className="absolute inset-0 z-[110] pointer-events-none">
                {/* Backdrop with enhanced blur */}
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-all duration-300 animate-fade-in"
                  onClick={closeTab}
                ></div>

                {/* Mobile: Bottom Sheet - More rounded and polished */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-auto lg:hidden z-10">
                  <div className="mobile-post-popup bg-white/98 backdrop-blur-xl rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform transition-all duration-300 ease-out animate-slide-up border-t border-white/40">
                    {/* Handle Bar - Thicker and more modern */}
                    <div className="flex justify-center pt-4 pb-2">
                      <div className="w-10 h-1.5 bg-gray-200/80 rounded-full"></div>
                    </div>

                    {/* Close Button - More visible and styled */}
                    <button
                      className="absolute top-5 right-5 w-9 h-9 bg-gray-100/80 backdrop-blur-sm hover:bg-gray-200/80 text-gray-500 rounded-full flex items-center justify-center transition-all duration-200 z-10 shadow-sm border border-white/20 active:scale-90"
                      onClick={closeTab}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Content */}
                    <div className="px-5 pb-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                      {loadedCommunity?.id === 'spendhbd' && infowindowData.isCluster ? (
                        <SpendHBDClusterInfo
                          features={infowindowData.features}
                          onStoreSelect={handleStoreSelect}
                          onClose={closeTab}
                          onViewOnMap={handleViewOnMap}
                        />
                      ) : loadedCommunity?.id === 'spendhbd' && infowindowData.features[0]?.properties?.name ? (
                        <SpendHBDInfoWindow
                          features={infowindowData.features}
                          onBack={handleBackToCluster}
                          onClose={closeTab}
                          showBackButton={true}
                          onViewOnMap={handleViewOnMap}
                          isCluster={infowindowData.isCluster || false}
                        />
                      ) : (
                        <InfoWindowContent features={infowindowData.features} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop: Centered Modal - Premium Glassmorphism Design */}
                <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-auto p-6 z-10">
                  <div className="w-full max-w-7xl bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transform transition-all duration-500 ease-out animate-modal-in border border-white/40 overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header - Minimal and elegant */}
                    <div className="relative flex items-center justify-between px-10 py-7 border-b border-gray-100/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner">
                          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-lexend)' }}>
                            {loadedCommunity?.id === 'spendhbd' ? 'Business Details' : 'Discover Adventures'}
                          </h2>
                          <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {infowindowData.features.length} {infowindowData.features.length === 1 ? 'pin' : 'pins'} found at this location
                          </p>
                        </div>
                      </div>

                      {/* Close Button - Premium Style */}
                      <button
                        className="w-12 h-12 bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all duration-300 group border border-gray-100 hover:border-orange-100 active:scale-95"
                        onClick={closeTab}
                      >
                        <svg className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-10 right-10 h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
                    </div>

                    {/* Content - Scrollable with optimized padding */}
                    <div className="px-10 py-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-transparent to-gray-50/30">
                      {loadedCommunity?.id === 'spendhbd' && infowindowData.isCluster ? (
                        <SpendHBDClusterInfo
                          features={infowindowData.features}
                          onStoreSelect={handleStoreSelect}
                          onClose={closeTab}
                          onViewOnMap={handleViewOnMap}
                        />
                      ) : loadedCommunity?.id === 'spendhbd' && infowindowData.features[0]?.properties?.name ? (
                        <SpendHBDInfoWindow
                          features={infowindowData.features}
                          onBack={handleBackToCluster}
                          onClose={closeTab}
                          showBackButton={true}
                          onViewOnMap={handleViewOnMap}
                          isCluster={infowindowData.isCluster || false}
                        />
                      ) : (
                        <InfoWindowContent features={infowindowData.features} hideHeader={true} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Map>
        </div>

      </div>
    </APIProvider>
  );
}

