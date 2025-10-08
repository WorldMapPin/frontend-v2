'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Journey, JourneyState, TravelMode, JourneyPin } from '../../types';
import { 
  loadJourneyState, 
  saveJourneyState, 
  createJourney, 
  saveJourney,
  deleteJourney,
  generateUniqueId,
  updateSegmentTravelMode,
  reorderPins,
  loadUserJourneys,
  canUserEditJourney,
  mergeUserJourneysToState
} from '../../utils/journeyStorage';
import { useHiveAuth } from '../../hooks/use-hive-auth';
import HiveLoginButton from './HiveLoginButton';
import PinTypeSelector from './PinTypeSelector';
import PinDetailsModal from './PinDetailsModal';
import StartingPostSelector from './StartingPostSelector';

interface SimpleJourneyEditorProps {
  onJourneyChange: (journey: Journey | null) => void;
  onStateChange: (state: JourneyState) => void;
  onShowUserPosts?: (username: string, onPostClick: (post: any) => void) => void;
}

export default function SimpleJourneyEditor({ onJourneyChange, onStateChange, onShowUserPosts }: SimpleJourneyEditorProps) {
  const { username, isAuthenticated } = useHiveAuth();
  const [state, setState] = useState<JourneyState>(() => loadJourneyState());
  const [newJourneyName, setNewJourneyName] = useState('');
  const [showNewJourneyInput, setShowNewJourneyInput] = useState(false);
  const [userJourneys, setUserJourneys] = useState<Journey[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Force dropdown re-render when journeys change
  const [isLoadingJourneys, setIsLoadingJourneys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedVersion, setLastSavedVersion] = useState<string>(''); // JSON of last saved journey
  const [canEdit, setCanEdit] = useState(false);
  const [pendingPinPosition, setPendingPinPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPinForDetails, setSelectedPinForDetails] = useState<JourneyPin | null>(null);
  const [showStartingPostSelector, setShowStartingPostSelector] = useState(false);
  const [pendingJourneyName, setPendingJourneyName] = useState<string>('');
  const [selectedStartingPost, setSelectedStartingPost] = useState<any | null>(null);

  // Handler to center map on pin location
  const handlePinClick = useCallback((pin: JourneyPin) => {
    // Dispatch event to center map on this pin
    window.dispatchEvent(new CustomEvent('center-map-on-pin', {
      detail: {
        lat: pin.position.lat,
        lng: pin.position.lng,
        zoom: 15
      }
    }));
    
    // Also show details modal
    setSelectedPinForDetails(pin);
  }, []);
  
  // Drag to resize state
  const [editorHeight, setEditorHeight] = useState(50); // percentage of viewport height
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(50);
  
  // Load user's journeys when authenticated or when auth changes
  useEffect(() => {
    const loadUserData = () => {
      // Only log in development and on client side
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('loadUserData called - isAuthenticated:', isAuthenticated, 'username:', username);
      }
      
      if (isAuthenticated && username) {
        setIsLoadingJourneys(true);
        const journeys = loadUserJourneys(username);
        setUserJourneys(journeys);
        setIsLoadingJourneys(false);
        
        // Update state to only show user's journeys
        setState(prevState => {
          const newState = {
            ...prevState,
            journeys: journeys,
            currentJourney: journeys.length > 0 && prevState.currentJourney && 
                            journeys.find(j => j.id === prevState.currentJourney?.id)
              ? prevState.currentJourney 
              : null,
            isEditMode: false // Reset edit mode on auth change
          };
          return newState;
        });
      } else {
        // Clear when logged out
        setUserJourneys([]);
        setState(prevState => ({
          ...prevState,
          journeys: [],
          currentJourney: null,
          isEditMode: false
        }));
      }
    };

    loadUserData();

    // Listen for auth changes
    const handleAuthChange = () => {
      // Add small delay to ensure localStorage is updated
      setTimeout(() => {
        loadUserData();
        // Force re-render by updating refresh key
        setRefreshKey(prev => prev + 1);
      }, 100);
    };

    window.addEventListener('hive-auth-state-change', handleAuthChange);
    return () => {
      window.removeEventListener('hive-auth-state-change', handleAuthChange);
    };
  }, [isAuthenticated, username]);

  // Update parent when state changes
  useEffect(() => {
    onStateChange(state);
    if (state.currentJourney) {
      onJourneyChange(state.currentJourney);
    } else {
      onJourneyChange(null);
    }
  }, [state, onStateChange, onJourneyChange]);

  // Save function - auto-saves and updates state
  const saveCurrentJourney = useCallback((journey: Journey) => {
    setIsSaving(true);
    
    // Full save to localStorage
    saveJourney(journey);
    
    // Update last saved version
    setLastSavedVersion(JSON.stringify(journey));
    
    // Use setState callback to preserve current isEditMode and update journeys
    setState(prevState => {
      const updatedUserJourneys = prevState.journeys.map(j => j.id === journey.id ? journey : j);
      
      // Safely merge with all users' data
      if (username) {
        const mergedState = mergeUserJourneysToState(
          username,
          updatedUserJourneys,
          journey,
          prevState.isEditMode
        );
        saveJourneyState(mergedState);
        
        // Return only the current user's view
        return {
          ...prevState,
          currentJourney: journey,
          journeys: updatedUserJourneys
        };
      }
      
      // Fallback if no username (shouldn't happen)
      return {
        ...prevState,
        currentJourney: journey,
        journeys: updatedUserJourneys
      };
    });
    
    onJourneyChange(journey);
    
    // Update userJourneys to refresh the dropdown with latest data
    setUserJourneys(prev => prev.map(j => j.id === journey.id ? journey : j));
    
    setTimeout(() => setIsSaving(false), 300); // Brief saving state for UI feedback
  }, [username, onJourneyChange]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!state.currentJourney) return false;
    const currentVersion = JSON.stringify(state.currentJourney);
    return currentVersion !== lastSavedVersion;
  }, [state.currentJourney, lastSavedVersion]);

  const handleToggleEditMode = () => {
    setState(prevState => {
      const newIsEditMode = !prevState.isEditMode;
      
      // Safely merge with all users' data
      if (username) {
        const mergedState = mergeUserJourneysToState(
          username,
          prevState.journeys,
          prevState.currentJourney,
          newIsEditMode
        );
        saveJourneyState(mergedState);
      }
      
      return { ...prevState, isEditMode: newIsEditMode };
    });
  };

  const handleCreateJourney = () => {
    if (!isAuthenticated || !username) {
      alert('Please login with Hive Keychain to create journeys');
      return;
    }

    if (newJourneyName.trim()) {
      // Store the journey name and show starting post selector
      setPendingJourneyName(newJourneyName.trim());
      setShowStartingPostSelector(true);
      setSelectedStartingPost(null);
      
      // Show user posts on map
      if (onShowUserPosts && username) {
        onShowUserPosts(username, (post) => {
          setSelectedStartingPost(post);
        });
      }
    }
  };

  // Handle starting from a post
  const handleStartFromPost = (post: any) => {
    if (!username || !pendingJourneyName) return;

    const newJourney = createJourney(pendingJourneyName, username);
    
    // Add the starting post as the first pin
    const firstPin: JourneyPin = {
      id: generateUniqueId(),
      position: {
        lat: post.lattitude, // API uses 'lattitude' with typo
        lng: post.longitude
      },
      title: post.title || 'Starting Post',
      description: '',
      order: 0,
      pinType: 'post',
      postId: post.id,
      postPermlink: post.permlink,
      postAuthor: post.author
    };

    const journeyWithStartingPin = {
      ...newJourney,
      pins: [firstPin]
    };
    
    setState(prevState => {
      const updatedUserJourneys = [...prevState.journeys, journeyWithStartingPin];
      
      // Safely merge with all users' data
      const mergedState = mergeUserJourneysToState(
        username,
        updatedUserJourneys,
        journeyWithStartingPin,
        true // Enable edit mode
      );
      saveJourneyState(mergedState);
      
      return {
        ...prevState,
        journeys: updatedUserJourneys,
        currentJourney: journeyWithStartingPin,
        isEditMode: true
      };
    });
    
    // Save the new journey
    saveJourney(journeyWithStartingPin);
    
    // Set last saved version for the new journey
    setLastSavedVersion(JSON.stringify(journeyWithStartingPin));
    
    // Update userJourneys to refresh the dropdown
    setUserJourneys(prev => [...prev, journeyWithStartingPin]);
    
    setNewJourneyName('');
    setShowNewJourneyInput(false);
    setPendingJourneyName('');
    setShowStartingPostSelector(false);
    setSelectedStartingPost(null);
    
    // Hide user posts from map
    window.dispatchEvent(new CustomEvent('hide-user-posts-on-map'));
    
    // Force refresh of the dropdown
    setRefreshKey(prev => prev + 1);
  };

  // Handle skipping starting post selection
  const handleSkipStartingPost = () => {
    if (!username || !pendingJourneyName) return;

    const newJourney = createJourney(pendingJourneyName, username);
    
    setState(prevState => {
      const updatedUserJourneys = [...prevState.journeys, newJourney];
      
      // Safely merge with all users' data
      const mergedState = mergeUserJourneysToState(
        username,
        updatedUserJourneys,
        newJourney,
        true // Enable edit mode
      );
      saveJourneyState(mergedState);
      
      return {
        ...prevState,
        journeys: updatedUserJourneys,
        currentJourney: newJourney,
        isEditMode: true
      };
    });
    
    // Save the new journey
    saveJourney(newJourney);
    
    // Set last saved version for the new journey
    setLastSavedVersion(JSON.stringify(newJourney));
    
    // Update userJourneys to refresh the dropdown
    setUserJourneys(prev => [...prev, newJourney]);
    
    setNewJourneyName('');
    setShowNewJourneyInput(false);
    setPendingJourneyName('');
    setShowStartingPostSelector(false);
    setSelectedStartingPost(null);
    
    // Hide user posts from map
    window.dispatchEvent(new CustomEvent('hide-user-posts-on-map'));
    
    // Force refresh of the dropdown
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectJourney = (journey: Journey) => {
    setState(prevState => {
      // Safely merge with all users' data
      if (username) {
        const mergedState = mergeUserJourneysToState(
          username,
          prevState.journeys,
          journey,
          prevState.isEditMode
        );
        saveJourneyState(mergedState);
      }
      
      return { ...prevState, currentJourney: journey };
    });
    
    // Set the last saved version when selecting a journey
    setLastSavedVersion(JSON.stringify(journey));
    
    onJourneyChange(journey);
  };

  const handleDeleteJourney = (journeyId: string) => {
    if (confirm('Delete this journey?')) {
      deleteJourney(journeyId);
      const newState = {
        ...state,
        journeys: state.journeys.filter(j => j.id !== journeyId),
        currentJourney: state.currentJourney?.id === journeyId ? null : state.currentJourney
      };
      setState(newState);
      
      // Update userJourneys to refresh the dropdown
      setUserJourneys(prev => prev.filter(j => j.id !== journeyId));
      
      if (state.currentJourney?.id === journeyId) {
        onJourneyChange(null);
      }
      
      // Force refresh of the dropdown
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleTravelModeChange = (mode: TravelMode) => {
    if (state.currentJourney) {
      const updatedJourney = { ...state.currentJourney, defaultTravelMode: mode };
      setState(prev => ({ ...prev, currentJourney: updatedJourney }));
      onJourneyChange(updatedJourney);
      // Auto-save after change
      saveCurrentJourney(updatedJourney);
    }
  };

  const handleSegmentTravelModeChange = (segmentId: string, mode: TravelMode) => {
    if (state.currentJourney) {
      const updatedJourney = updateSegmentTravelMode(state.currentJourney, segmentId, mode);
      setState(prev => ({ ...prev, currentJourney: updatedJourney }));
      onJourneyChange(updatedJourney);
      // Auto-save after change
      saveCurrentJourney(updatedJourney);
    }
  };

  const handleMovePin = (pinId: string, direction: 'up' | 'down') => {
    if (!state.currentJourney) return;
    
    const pins = [...state.currentJourney.pins].sort((a, b) => a.order - b.order);
    const currentIndex = pins.findIndex(p => p.id === pinId);
    
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === pins.length - 1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    const updatedJourney = reorderPins(state.currentJourney, currentIndex, newIndex);
    setState(prev => ({ ...prev, currentJourney: updatedJourney }));
    onJourneyChange(updatedJourney);
    // Auto-save after change
    saveCurrentJourney(updatedJourney);
  };

  const getTravelModeIcon = (mode: TravelMode): string => {
    switch (mode) {
      case 'DRIVING': return '🚗';
      case 'WALKING': return '🚶';
      case 'BICYCLING': return '🚴';
      case 'TRANSIT': return '🚌';
      case 'FLYING': return '✈️';
      default: return '🚗';
    }
  };

  const getTravelModeLabel = (mode: TravelMode): string => {
    switch (mode) {
      case 'DRIVING': return 'Driving';
      case 'WALKING': return 'Walking';
      case 'BICYCLING': return 'Bicycling';
      case 'TRANSIT': return 'Transit';
      case 'FLYING': return 'Flying';
      default: return 'Driving';
    }
  };

  const handleRemovePin = (pinId: string) => {
    if (!state.currentJourney) return;
    
    const updatedPins = state.currentJourney.pins
      .filter(p => p.id !== pinId)
      .map((pin, index) => ({ ...pin, order: index }));

    // Update segments - remove segments connected to this pin and reconnect
    const updatedSegments = state.currentJourney.segments?.filter(s => 
      s.fromPinId !== pinId && s.toPinId !== pinId
    ) || [];

    const updatedJourney = {
      ...state.currentJourney,
      pins: updatedPins,
      segments: updatedSegments
    };

    setState(prev => ({ ...prev, currentJourney: updatedJourney }));
    onJourneyChange(updatedJourney);
    // Auto-save after change
    saveCurrentJourney(updatedJourney);
  };

  const handleClearJourney = () => {
    if (state.currentJourney && confirm('Clear all pins?')) {
      const updatedJourney = { 
        ...state.currentJourney, 
        pins: [], 
        segments: [] 
      };
      setState(prev => ({ ...prev, currentJourney: updatedJourney }));
      onJourneyChange(updatedJourney);
      // Auto-save after change
      saveCurrentJourney(updatedJourney);
    }
  };

  const handleAddPinFromMap = useCallback((position: { lat: number; lng: number }) => {
    if (!state.currentJourney || !state.isEditMode || !isAuthenticated || !username) return;
    
    // Check if user owns this journey
    if (!canUserEditJourney(state.currentJourney, username)) return;

    // Show pin type selector modal
    setPendingPinPosition(position);
  }, [state.currentJourney, state.isEditMode, isAuthenticated, username]);

  // Handle pin data from modal
  const handlePinConfirm = useCallback((pinData: {
    position: { lat: number; lng: number };
    title: string;
    pinType: any;
    postId?: number;
    postPermlink?: string;
    postAuthor?: string;
    imageUrl?: string;
    imageCaption?: string;
  }) => {
    if (!state.currentJourney) return;

    const newPin: JourneyPin = {
      id: generateUniqueId(),
      position: pinData.position,
      title: pinData.title,
      description: pinData.imageCaption || '',
      order: state.currentJourney.pins.length,
      pinType: pinData.pinType,
      postId: pinData.postId,
      postPermlink: pinData.postPermlink,
      postAuthor: pinData.postAuthor,
      imageUrl: pinData.imageUrl,
      imageCaption: pinData.imageCaption
    };

    const updatedPins = [...state.currentJourney.pins, newPin];
    let updatedSegments = [...(state.currentJourney.segments || [])];

    // Create segment to previous pin if there are existing pins
    if (state.currentJourney.pins.length > 0) {
      const lastPin = state.currentJourney.pins[state.currentJourney.pins.length - 1];
      const newSegment = {
        id: generateUniqueId(),
        fromPinId: lastPin.id,
        toPinId: newPin.id,
        travelMode: state.currentJourney.defaultTravelMode,
        order: updatedSegments.length
      };
      updatedSegments.push(newSegment);
    }

    const updatedJourney = {
      ...state.currentJourney,
      pins: updatedPins,
      segments: updatedSegments
    };

    setState(prev => ({ ...prev, currentJourney: updatedJourney }));
    onJourneyChange(updatedJourney);
    // Auto-save after adding pin
    saveCurrentJourney(updatedJourney);
    
    // Close modal
    setPendingPinPosition(null);
  }, [state.currentJourney, onJourneyChange, saveCurrentJourney]);

  // Expose the add pin function globally for the map component
  useEffect(() => {
    (window as any).addPinToCurrentJourney = handleAddPinFromMap;
    return () => {
      (window as any).addPinToCurrentJourney = null;
    };
  }, [handleAddPinFromMap]);

  // Update canEdit state when journey or user changes
  useEffect(() => {
    setCanEdit(canUserEditJourney(state.currentJourney, username));
  }, [state.currentJourney, username]);

  // Drag handlers for resizing
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartHeight(editorHeight);
  };

  useEffect(() => {
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartY - clientY;
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;
      
      const newHeight = Math.min(Math.max(dragStartHeight + deltaPercent, 25), 90);
      setEditorHeight(newHeight);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStartY, dragStartHeight]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center">
      <div 
        className="bg-white shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col animate-slide-up rounded-t-3xl border-t-2 border-gray-200"
        style={{ maxHeight: `${editorHeight}vh` }}
      >
        {/* Drag handle */}
        <div 
          className="flex justify-center pt-2 pb-1 bg-gray-100 cursor-ns-resize active:cursor-grabbing hover:bg-gray-200 transition-colors"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-400 rounded-full"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pt-1">
          <h3 className="text-lg font-bold text-gray-800">🗺️ Journeys</h3>
          
          {/* Edit Mode Toggle - Only show if user can edit */}
          {canEdit && (
            <button
              onClick={handleToggleEditMode}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                state.isEditMode 
                  ? 'bg-green-500 text-white shadow-green-200' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {state.isEditMode ? '✏️ Edit' : '👁️ View'}
            </button>
          )}
        </div>

        {/* Hive Login */}
        <HiveLoginButton />

        {/* Not logged in message */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="text-blue-800 text-xs">
              <div className="font-medium mb-0.5">🔐 Login Required</div>
              <div className="text-blue-600">
                Login with Hive to create journeys
              </div>
            </div>
          </div>
        )}

         {/* Edit Mode Instructions */}
         {isAuthenticated && state.isEditMode && canEdit && (
           <div className="bg-green-50 border border-green-200 rounded-lg p-2">
             <div className="text-green-800 text-xs">
               <div className="font-medium mb-0.5">🎯 Edit Mode</div>
               <div className="text-green-600">
                 Tap map to add pins
               </div>
             </div>
           </div>
         )}

        {/* Journey Selection - Only show when authenticated */}
        {isAuthenticated && (
          <div key={`journey-select-${refreshKey}`}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Journeys {state.journeys.length > 0 && `(${state.journeys.length})`}
              {isLoadingJourneys && <span className="ml-1 text-xs text-blue-500">⏳</span>}
            </label>
            <select
              key={`journey-dropdown-${refreshKey}-${state.journeys.length}`}
              value={state.currentJourney?.id || ''}
              onChange={(e) => {
                const journey = state.journeys.find(j => j.id === e.target.value);
                if (journey) handleSelectJourney(journey);
              }}
              disabled={isLoadingJourneys}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="">
                {isLoadingJourneys 
                  ? 'Loading journeys...'
                  : state.journeys.length === 0 
                    ? 'No journeys yet - create one below!' 
                    : 'Select a journey...'}
              </option>
              {state.journeys.map(journey => (
                <option key={journey.id} value={journey.id}>
                  {journey.name} ({journey.pins.length} pins)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* New Journey - Only show when authenticated */}
        {isAuthenticated && (
          <div>
            {showNewJourneyInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newJourneyName}
                  onChange={(e) => setNewJourneyName(e.target.value)}
                  placeholder="Journey name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateJourney()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateJourney}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewJourneyInput(false);
                      setNewJourneyName('');
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewJourneyInput(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                ✨ New Journey
              </button>
            )}
          </div>
        )}

        {/* Current Journey Details */}
        {state.currentJourney && (
          <div className="bg-blue-50 rounded-lg p-2 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-800">{state.currentJourney.name}</h4>
              <span className="text-xs text-gray-500">{state.currentJourney.pins.length} pins</span>
            </div>

            {/* Travel Mode - Compact inline */}
            <select
              value={state.currentJourney.defaultTravelMode}
              onChange={(e) => handleTravelModeChange(e.target.value as TravelMode)}
              disabled={!state.isEditMode || !canEdit}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="DRIVING">🚗 Driving</option>
              <option value="WALKING">🚶 Walking</option>
              <option value="BICYCLING">🚴 Bicycling</option>
              <option value="TRANSIT">🚌 Transit</option>
              <option value="FLYING">✈️ Flying</option>
            </select>

            {/* Journey Route - Takes most space */}
            {state.currentJourney.pins.length > 0 && (
              <div className="space-y-1 flex-1 min-h-0">
                <h5 className="text-xs font-medium text-gray-700">Waypoints ({state.currentJourney.pins.length})</h5>
                <div className="space-y-1">
                  {state.currentJourney.pins
                    .sort((a, b) => a.order - b.order)
                    .map((pin, index) => {
                      const nextPin = state.currentJourney!.pins
                        .sort((a, b) => a.order - b.order)[index + 1];
                      const segment = nextPin ? state.currentJourney!.segments?.find(s => 
                        s.fromPinId === pin.id && s.toPinId === nextPin.id
                      ) : null;

                      return (
                        <div key={pin.id}>
                          {/* Pin */}
                          <div className="bg-white rounded-xl border-2 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                               onClick={() => handlePinClick(pin)}>
                            {/* Pin Image - if available */}
                            {pin.imageUrl && (
                              <div className="relative w-full h-32 bg-gray-100">
                                <img 
                                  src={pin.imageUrl} 
                                  alt={pin.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1.5 left-1.5 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                  {index + 1}
                                </div>
                                {/* Pin Type Badge */}
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded backdrop-blur-sm">
                                  {(!pin.pinType || pin.pinType === 'post') && '📄'}
                                  {pin.pinType === 'snap' && '📸'}
                                  {pin.pinType === 'future-post' && '📝'}
                                  {pin.pinType === 'placeholder' && '📌'}
                                </div>
                              </div>
                            )}
                            
                            <div className="p-2">
                              <div className="flex items-start space-x-2">
                                {/* Pin Number (if no image) */}
                                {!pin.imageUrl && (
                                  <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                                    {index + 1}
                                  </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  {/* Title and Type */}
                                  <div className="flex items-center space-x-1 mb-1">
                                    <span className="font-medium text-sm">{pin.title}</span>
                                    {!pin.imageUrl && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                        {(!pin.pinType || pin.pinType === 'post') && '📄'}
                                        {pin.pinType === 'snap' && '📸'}
                                        {pin.pinType === 'future-post' && '📝'}
                                        {pin.pinType === 'placeholder' && '📌'}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Post Link - if linked to a post - Enhanced with image */}
                                  {pin.postPermlink && (
                                    <a 
                                      href={`https://worldmappin.com/@${pin.postAuthor}/${pin.postPermlink}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mb-1 block bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all overflow-hidden"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Post Image */}
                                      {pin.imageUrl && (
                                        <div className="relative w-full h-24 bg-gray-100">
                                          <img 
                                            src={pin.imageUrl} 
                                            alt={pin.title}
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute top-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium shadow-lg">
                                            📄 Post
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Post Details */}
                                      <div className="p-2">
                                        {!pin.imageUrl && (
                                          <div className="text-xs text-blue-600 font-semibold mb-1 flex items-center space-x-1">
                                            <span>📄</span>
                                            <span>Linked WorldMapPin Post</span>
                                          </div>
                                        )}
                                        
                                        {/* Title */}
                                        {pin.title && (
                                          <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                                            {pin.title}
                                          </div>
                                        )}
                                        
                                        {/* Author */}
                                        <div className="text-xs text-blue-600 font-medium mb-1">
                                          @{pin.postAuthor}
                                        </div>
                                        
                                        {/* Permlink - subtle */}
                                        <div className="text-xs text-gray-500 truncate">
                                          {pin.postPermlink.substring(0, 40)}{pin.postPermlink.length > 40 ? '...' : ''}
                                        </div>
                                      </div>
                                    </a>
                                  )}
                                  
                                  {/* Image Caption - for snaps - Enhanced styling */}
                                  {pin.imageCaption && (
                                    <div className="mb-1 p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-colors">
                                      <div className="text-xs text-purple-600 font-semibold mb-1 flex items-center space-x-1">
                                        <span>💬</span>
                                        <span>Caption</span>
                                      </div>
                                      <div className="text-xs text-gray-800 italic line-clamp-3 leading-relaxed">
                                        "{pin.imageCaption}"
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Coordinates */}
                                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                                    <span>📍</span>
                                    <span>{pin.position.lat.toFixed(4)}, {pin.position.lng.toFixed(4)}</span>
                                  </div>
                                </div>
                                
                                {/* Pin Controls */}
                                {state.isEditMode && canEdit && (
                                  <div className="flex flex-col space-y-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {/* Move Up */}
                                    <button
                                      onClick={() => handleMovePin(pin.id, 'up')}
                                      disabled={index === 0}
                                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Move up"
                                    >
                                      <span className="text-gray-600 text-xs">↑</span>
                                    </button>
                                    
                                    {/* Move Down */}
                                    <button
                                      onClick={() => handleMovePin(pin.id, 'down')}
                                      disabled={index === state.currentJourney!.pins.length - 1}
                                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Move down"
                                    >
                                      <span className="text-gray-600 text-xs">↓</span>
                                    </button>
                                    
                                    {/* Remove Pin */}
                                    <button
                                      onClick={() => handleRemovePin(pin.id)}
                                      className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded flex items-center justify-center transition-colors"
                                      title="Remove pin"
                                    >
                                      <span className="text-red-600 text-xs">✕</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Segment (Travel Method) */}
                          {segment && nextPin && (
                            <div className="ml-2 my-0.5">
                              <div className="flex items-center space-x-1.5 p-1.5 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                                <div className="text-sm flex-shrink-0">
                                  {getTravelModeIcon(segment.travelMode)}
                                </div>
                                
                                {state.isEditMode && canEdit ? (
                                  <select
                                    value={segment.travelMode}
                                    onChange={(e) => handleSegmentTravelModeChange(segment.id, e.target.value as TravelMode)}
                                    className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="DRIVING">🚗 Driving</option>
                                    <option value="WALKING">🚶 Walking</option>
                                    <option value="BICYCLING">🚴 Bicycling</option>
                                    <option value="TRANSIT">🚌 Transit</option>
                                    <option value="FLYING">✈️ Flying</option>
                                  </select>
                                ) : (
                                  <div className="flex-1 text-xs text-gray-600">
                                    {getTravelModeLabel(segment.travelMode)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Action Buttons - Only show if user owns journey */}
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={handleClearJourney}
                  disabled={!state.isEditMode || state.currentJourney.pins.length === 0}
                  className="flex-1 bg-orange-500 text-white py-1.5 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => handleDeleteJourney(state.currentJourney!.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
                >
                  🗑️
                </button>
              </div>
            )}

            {/* Save Button - Compact */}
            {canEdit && (
              <button
                onClick={() => saveCurrentJourney(state.currentJourney!)}
                disabled={!hasUnsavedChanges() || isSaving}
                className={`w-full py-1.5 rounded-lg transition-all text-xs font-medium ${
                  hasUnsavedChanges() 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? '💾 Saving...' : hasUnsavedChanges() ? '💾 Save' : '✓ Saved'}
              </button>
            )}

            {/* View Journey Details Button */}
            <a
              href={`/journey/${state.currentJourney.createdBy}/${state.currentJourney.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 rounded-lg transition-all text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 text-center block"
            >
              🔗 View Journey Details
            </a>

            {/* Ownership message */}
            {!canEdit && (
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
                📖 Viewing @{state.currentJourney.createdBy}'s journey
              </p>
            )}

            {canEdit && !state.isEditMode && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Enable edit mode to make changes
              </p>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Pin Type Selector Modal */}
      {pendingPinPosition && username && (
        <PinTypeSelector
          position={pendingPinPosition}
          username={username}
          onConfirm={handlePinConfirm}
          onCancel={() => setPendingPinPosition(null)}
        />
      )}

      {/* Pin Details Modal */}
      {selectedPinForDetails && (
        <PinDetailsModal
          pin={selectedPinForDetails}
          onClose={() => setSelectedPinForDetails(null)}
        />
      )}

      {/* Starting Post Selector Modal */}
      {showStartingPostSelector && username && (
        <StartingPostSelector
          username={username}
          onSelect={handleStartFromPost}
          onSkip={handleSkipStartingPost}
          onCancel={() => {
            setShowStartingPostSelector(false);
            setPendingJourneyName('');
            setSelectedStartingPost(null);
            // Hide user posts from map
            window.dispatchEvent(new CustomEvent('hide-user-posts-on-map'));
          }}
          selectedPostId={selectedStartingPost?.id}
        />
      )}
    </div>
  );
}
