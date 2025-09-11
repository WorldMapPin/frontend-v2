// Custom hook for managing map viewport and bounds
// This hook provides real-time access to the current map viewport including
// bounding box, zoom level, and map instance for clustering and data loading

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { BBox } from 'geojson';

type MapViewportOptions = {
  padding?: number;
};

/**
 * Custom hook for managing map viewport state
 * Provides real-time access to map bounds, zoom level, and map instance
 * Used by clustering components to determine which markers to display
 * 
 * @param options - Configuration options including padding
 * @returns Object containing map instance, bounding box, and zoom level
 */
export function useMapViewport({ padding = 0 }: MapViewportOptions = {}) {
  const map = useMap();
  const [bbox, setBbox] = useState<BBox>([-180, -90, 180, 90]);
  const [zoom, setZoom] = useState(0);

  // Observe the map to get current bounds and zoom level
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const projection = map.getProjection();

      if (!bounds || !zoom || !projection) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      // Calculate padding in degrees based on zoom level
      const paddingDegrees = degreesPerPixel(zoom) * padding;

      // Apply padding to bounds while respecting world boundaries
      const n = Math.min(90, ne.lat() + paddingDegrees);
      const s = Math.max(-90, sw.lat() - paddingDegrees);

      const w = sw.lng() - paddingDegrees;
      const e = ne.lng() + paddingDegrees;

      setBbox([w, s, e, n]);
      setZoom(zoom);
    });

    return () => listener.remove();
  }, [map, padding]);

  return { map, bbox, zoom }; // Map Instance Exposed
}

/**
 * Calculates degrees per pixel at a given zoom level
 * Used to convert pixel-based padding to geographic degrees
 * 
 * @param zoomLevel - The current zoom level of the map
 * @returns Degrees per pixel at the given zoom level
 */
function degreesPerPixel(zoomLevel: number) {
  // 360° divided by the number of pixels at the zoom-level
  return 360 / (Math.pow(2, zoomLevel) * 256);
}

