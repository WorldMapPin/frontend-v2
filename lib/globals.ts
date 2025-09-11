// Global state management for the map application
// This module provides global state setters that can be accessed from anywhere in the app

// Global state setters (for external access)
export let setGlobalLocation: (location: google.maps.places.Place | undefined) => void;
export let setGlobalZoom: (zoom: number | undefined) => void;
export let mapZoom = 3;
export let isMenuOpen = false;

// Initialize global setters
export const initializeGlobals = (
  locationSetter: (location: google.maps.places.Place | undefined) => void,
  zoomSetter: (zoom: number | undefined) => void
) => {
  setGlobalLocation = locationSetter;
  setGlobalZoom = zoomSetter;
};

