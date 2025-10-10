import { useState, useEffect } from 'react';

/**
 * Hook to detect when Google Maps API is fully loaded and available
 */
export function useGoogleMapsLoaded(): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true);
      return;
    }

    // Set up interval to check for Google Maps API
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMaps()) {
      return;
    }

    // Check periodically until loaded
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  return isLoaded;
}
