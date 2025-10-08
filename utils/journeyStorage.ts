// Local storage utilities for journeys and mock pins
import { Journey, JourneyState, MockPin, MarkerPosition, JourneyPin, JourneySegment } from '../types';
import { createTempSave, markJourneyAsSaved, getLatestTempSave, autoSaveManager, loadLatestJourneyBackup } from './tempSaveManager';

const JOURNEYS_KEY = 'worldmappin_journeys';
const MOCK_PINS_KEY = 'worldmappin_mock_pins';

// Default state
const getDefaultState = (): JourneyState => ({
  journeys: [],
  currentJourney: null,
  editableUsers: [], // Deprecated - keeping for backwards compatibility
  activeUser: '', // Deprecated - keeping for backwards compatibility
  isEditMode: false // Default to view mode
});

// Generate mock pins for testing
const generateMockPins = (): MockPin[] => [
  {
    id: 'pin-1',
    position: { lat: 40.7128, lng: -74.0060 },
    title: 'New York City',
    description: 'The Big Apple'
  },
  {
    id: 'pin-2',
    position: { lat: 34.0522, lng: -118.2437 },
    title: 'Los Angeles',
    description: 'City of Angels'
  },
  {
    id: 'pin-3',
    position: { lat: 41.8781, lng: -87.6298 },
    title: 'Chicago',
    description: 'The Windy City'
  },
  {
    id: 'pin-4',
    position: { lat: 29.7604, lng: -95.3698 },
    title: 'Houston',
    description: 'Space City'
  },
  {
    id: 'pin-5',
    position: { lat: 33.4484, lng: -112.0740 },
    title: 'Phoenix',
    description: 'Valley of the Sun'
  },
  {
    id: 'pin-6',
    position: { lat: 39.9526, lng: -75.1652 },
    title: 'Philadelphia',
    description: 'City of Brotherly Love'
  },
  {
    id: 'pin-7',
    position: { lat: 32.7767, lng: -96.7970 },
    title: 'Dallas',
    description: 'Big D'
  },
  {
    id: 'pin-8',
    position: { lat: 37.7749, lng: -122.4194 },
    title: 'San Francisco',
    description: 'The Golden Gate City'
  }
];

// Journey storage functions
export const saveJourneyState = (state: JourneyState): void => {
  try {
    localStorage.setItem(JOURNEYS_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save journey state:', error);
  }
};

// Migrate old journey format to new format
const migrateJourney = (journey: any): Journey => {
  // Migrate pins to new format with pinType
  const migratedPins = journey.pins ? journey.pins.map((pin: any) => ({
    ...pin,
    pinType: pin.pinType || 'placeholder', // Default old pins to placeholder
    postId: pin.postId,
    postPermlink: pin.postPermlink,
    postAuthor: pin.postAuthor,
    imageUrl: pin.imageUrl,
    imageCaption: pin.imageCaption
  })) : [];

  // If journey already has segments, return with migrated pins
  if (journey.segments) {
    return {
      ...journey,
      pins: migratedPins
    };
  }

  // Migrate old format - create segments between consecutive pins
  const segments: JourneySegment[] = [];
  if (migratedPins.length > 1) {
    const sortedPins = migratedPins.sort((a: any, b: any) => a.order - b.order);
    
    for (let i = 0; i < sortedPins.length - 1; i++) {
      const fromPin = sortedPins[i];
      const toPin = sortedPins[i + 1];
      
      segments.push({
        id: generateUniqueId(),
        fromPinId: fromPin.id,
        toPinId: toPin.id,
        travelMode: journey.travelMode || 'DRIVING', // Use old travelMode or default
        order: i
      });
    }
  }

  return {
    ...journey,
    pins: migratedPins,
    segments,
    defaultTravelMode: journey.travelMode || 'DRIVING', // Migrate old travelMode
    // Remove old travelMode property
    travelMode: undefined
  };
};

export const loadJourneyState = (): JourneyState => {
  try {
    const stored = localStorage.getItem(JOURNEYS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Migrate journeys to new format
      const migratedJourneys = parsed.journeys ? parsed.journeys.map(migrateJourney) : [];
      const migratedCurrentJourney = parsed.currentJourney ? migrateJourney(parsed.currentJourney) : null;
      
      // Ensure we have all required properties with defaults
      return {
        ...getDefaultState(),
        ...parsed,
        journeys: migratedJourneys,
        currentJourney: migratedCurrentJourney
      };
    }
  } catch (error) {
    console.error('Failed to load journey state:', error);
  }
  return getDefaultState();
};

// Load journeys for a specific user
export const loadUserJourneys = (username: string): Journey[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(JOURNEYS_KEY);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading journeys for user:', username);
      console.log('Stored data:', stored);
    }
    
    if (stored) {
      const state = JSON.parse(stored) as JourneyState;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Parsed state:', state);
        console.log('All journeys:', state.journeys);
      }
      
      const userJourneys = state.journeys
        .filter(j => j.createdBy.toLowerCase() === username.toLowerCase())
        .map(migrateJourney);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Filtered user journeys:', userJourneys);
      }
      return userJourneys;
    }
  } catch (error) {
    console.error('Error loading user journeys:', error);
  }

  return [];
};

// Load user journeys with temp saves and JSON backups
export const loadUserJourneysWithTempSaves = (username: string): Journey[] => {
  if (process.env.NODE_ENV === 'development') {
    console.log('loadUserJourneysWithTempSaves called for:', username);
  }
  
  const savedJourneys = loadUserJourneys(username);
  if (process.env.NODE_ENV === 'development') {
    console.log('Saved journeys found:', savedJourneys.length);
  }
  
  // Check for temp saves
  const tempJourney = getLatestTempSave();
  if (process.env.NODE_ENV === 'development') {
    console.log('Latest temp save:', tempJourney);
  }
  
  if (tempJourney && tempJourney.createdBy.toLowerCase() === username.toLowerCase()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Temp journey belongs to user, checking if newer...');
    }
    // Check if this temp save is newer than the saved version
    const savedVersion = savedJourneys.find(j => j.id === tempJourney.id);
    if (!savedVersion || new Date(tempJourney.updatedAt) > new Date(savedVersion.updatedAt)) {
      // Replace or add the temp save
      const filteredJourneys = savedJourneys.filter(j => j.id !== tempJourney.id);
      const result = [...filteredJourneys, tempJourney];
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning journeys with temp save:', result);
      }
      return result;
    }
  }
  
  // Check for JSON backups
  const jsonBackup = loadLatestJourneyBackup(username);
  if (process.env.NODE_ENV === 'development') {
    console.log('JSON backup found:', jsonBackup);
  }
  
  if (jsonBackup) {
    // Check if this JSON backup is newer than the saved version
    const savedVersion = savedJourneys.find(j => j.id === jsonBackup.id);
    if (!savedVersion || new Date(jsonBackup.updatedAt) > new Date(savedVersion.updatedAt)) {
      // Replace or add the JSON backup
      const filteredJourneys = savedJourneys.filter(j => j.id !== jsonBackup.id);
      const result = [...filteredJourneys, jsonBackup];
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning journeys with JSON backup:', result);
      }
      return result;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Returning saved journeys only:', savedJourneys);
  }
  return savedJourneys;
};

// Check if user owns a journey
export const canUserEditJourney = (journey: Journey | null, username: string | null): boolean => {
  if (!journey || !username) return false;
  return journey.createdBy.toLowerCase() === username.toLowerCase();
};

// Mock pins storage functions
export const saveMockPins = (pins: MockPin[]): void => {
  try {
    localStorage.setItem(MOCK_PINS_KEY, JSON.stringify(pins));
  } catch (error) {
    console.error('Failed to save mock pins:', error);
  }
};

export const loadMockPins = (): MockPin[] => {
  try {
    const stored = localStorage.getItem(MOCK_PINS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load mock pins:', error);
  }
  
  // Return default mock pins if none exist
  const defaultPins = generateMockPins();
  saveMockPins(defaultPins);
  return defaultPins;
};

// Journey management functions
export const createJourney = (name: string, createdBy: string): Journey => {
  const now = new Date().toISOString();
  return {
    id: `journey-${Date.now()}`,
    name,
    description: '',
    pins: [],
    segments: [],
    defaultTravelMode: 'DRIVING',
    createdBy,
    createdAt: now,
    updatedAt: now
  };
};

export const saveJourney = (journey: Journey): void => {
  const state = loadJourneyState();
  const existingIndex = state.journeys.findIndex(j => j.id === journey.id);
  
  const updatedJourney = {
    ...journey,
    updatedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    state.journeys[existingIndex] = updatedJourney;
  } else {
    state.journeys.push(updatedJourney);
  }
  
  saveJourneyState(state);
  
  // Mark as saved in temp save system
  markJourneyAsSaved(journey.id);
  
  // Update auto-save manager
  autoSaveManager.updateJourney(updatedJourney);
};

// Helper function to safely update journeys for a specific user without losing other users' data
export const mergeUserJourneysToState = (username: string, userJourneys: Journey[], currentJourney: Journey | null, isEditMode: boolean): JourneyState => {
  // Load all existing journeys from localStorage
  const fullState = loadJourneyState();
  
  // Filter out the current user's old journeys
  const otherUsersJourneys = fullState.journeys.filter(
    j => j.createdBy.toLowerCase() !== username.toLowerCase()
  );
  
  // Merge other users' journeys with current user's updated journeys
  const mergedJourneys = [...otherUsersJourneys, ...userJourneys];
  
  // Return updated state preserving all data
  return {
    ...fullState,
    journeys: mergedJourneys,
    currentJourney,
    isEditMode
  };
};

export const deleteJourney = (journeyId: string): void => {
  const state = loadJourneyState();
  state.journeys = state.journeys.filter(j => j.id !== journeyId);
  if (state.currentJourney?.id === journeyId) {
    state.currentJourney = null;
  }
  saveJourneyState(state);
};

export const updateEditableUsers = (users: string[]): void => {
  const state = loadJourneyState();
  state.editableUsers = users;
  saveJourneyState(state);
};

export const setActiveUser = (username: string): void => {
  const state = loadJourneyState();
  state.activeUser = username;
  saveJourneyState(state);
};

// Utility functions
export const canEditJourney = (journey: Journey, activeUser: string, editableUsers: string[]): boolean => {
  return editableUsers.includes(activeUser) || journey.createdBy === activeUser;
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Pin management functions
export const addPinToJourney = (journey: Journey, position: MarkerPosition, title?: string): Journey => {
  const newPin: JourneyPin = {
    id: generateUniqueId(),
    position,
    title: title || `Pin ${journey.pins.length + 1}`,
    description: '',
    order: journey.pins.length,
    pinType: 'placeholder' // Default to placeholder
  };

  const updatedPins = [...journey.pins, newPin];
  const updatedSegments = [...journey.segments];

  // Create segment to previous pin if there are existing pins
  if (journey.pins.length > 0) {
    const lastPin = journey.pins[journey.pins.length - 1];
    const newSegment: JourneySegment = {
      id: generateUniqueId(),
      fromPinId: lastPin.id,
      toPinId: newPin.id,
      travelMode: journey.defaultTravelMode,
      order: journey.segments.length
    };
    updatedSegments.push(newSegment);
  }

  return {
    ...journey,
    pins: updatedPins,
    segments: updatedSegments,
    updatedAt: new Date().toISOString()
  };
};

export const removePinFromJourney = (journey: Journey, pinId: string): Journey => {
  const updatedPins = journey.pins
    .filter(p => p.id !== pinId)
    .map((pin, index) => ({ ...pin, order: index }));

  // Remove all segments connected to this pin
  const updatedSegments = journey.segments
    .filter(s => s.fromPinId !== pinId && s.toPinId !== pinId)
    .map((segment, index) => ({ ...segment, order: index }));

  // Reconnect segments if pin was in the middle
  const removedPin = journey.pins.find(p => p.id === pinId);
  if (removedPin) {
    const incomingSegment = journey.segments.find(s => s.toPinId === pinId);
    const outgoingSegment = journey.segments.find(s => s.fromPinId === pinId);
    
    if (incomingSegment && outgoingSegment) {
      // Create new segment connecting the previous and next pins
      const newSegment: JourneySegment = {
        id: generateUniqueId(),
        fromPinId: incomingSegment.fromPinId,
        toPinId: outgoingSegment.toPinId,
        travelMode: incomingSegment.travelMode, // Use the incoming segment's travel mode
        order: updatedSegments.length
      };
      updatedSegments.push(newSegment);
    }
  }

  return {
    ...journey,
    pins: updatedPins,
    segments: updatedSegments,
    updatedAt: new Date().toISOString()
  };
};

export const updateSegmentTravelMode = (journey: Journey, segmentId: string, travelMode: string): Journey => {
  const updatedSegments = journey.segments.map(segment =>
    segment.id === segmentId
      ? { ...segment, travelMode: travelMode as any }
      : segment
  );

  return {
    ...journey,
    segments: updatedSegments,
    updatedAt: new Date().toISOString()
  };
};

export const reorderPins = (journey: Journey, fromIndex: number, toIndex: number): Journey => {
  const updatedPins = [...journey.pins];
  const [movedPin] = updatedPins.splice(fromIndex, 1);
  updatedPins.splice(toIndex, 0, movedPin);

  // Update order
  const reorderedPins = updatedPins.map((pin, index) => ({ ...pin, order: index }));

  // Rebuild segments based on new pin order
  const newSegments: JourneySegment[] = [];
  for (let i = 0; i < reorderedPins.length - 1; i++) {
    const fromPin = reorderedPins[i];
    const toPin = reorderedPins[i + 1];
    
    // Find existing segment between these pins or create new one
    const existingSegment = journey.segments.find(s => 
      (s.fromPinId === fromPin.id && s.toPinId === toPin.id) ||
      (s.fromPinId === toPin.id && s.toPinId === fromPin.id)
    );
    
    const segment: JourneySegment = existingSegment ? {
      ...existingSegment,
      fromPinId: fromPin.id,
      toPinId: toPin.id,
      order: i
    } : {
      id: generateUniqueId(),
      fromPinId: fromPin.id,
      toPinId: toPin.id,
      travelMode: journey.defaultTravelMode,
      order: i
    };
    
    newSegments.push(segment);
  }

  return {
    ...journey,
    pins: reorderedPins,
    segments: newSegments,
    updatedAt: new Date().toISOString()
  };
};

