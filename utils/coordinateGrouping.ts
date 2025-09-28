// Utility functions for grouping pins by exact coordinates
// This module handles grouping of pins that share the same lat/lng coordinates

import { Feature, Point } from 'geojson';

export interface GroupedPin {
  coordinates: [number, number]; // [lng, lat]
  count: number;
  features: Feature<Point>[];
  id: string;
}

/**
 * Groups pins by exact coordinates for SpendHBD locations
 * Pins with the same lat/lng will be grouped together with a count
 * 
 * @param features - Array of GeoJSON features to group
 * @returns Array of grouped pins with coordinates and counts
 */
export function groupPinsByCoordinates(features: Feature<Point>[]): GroupedPin[] {
  const coordinateMap = new Map<string, GroupedPin>();
  
  features.forEach((feature, index) => {
    const [lng, lat] = feature.geometry.coordinates;
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`; // Use 6 decimal places for precision
    
    if (coordinateMap.has(key)) {
      // Add to existing group
      const group = coordinateMap.get(key)!;
      group.count++;
      group.features.push(feature);
    } else {
      // Create new group
      coordinateMap.set(key, {
        coordinates: [lng, lat],
        count: 1,
        features: [feature],
        id: `group_${lat.toFixed(6)}_${lng.toFixed(6)}`
      });
    }
  });
  
  return Array.from(coordinateMap.values());
}

/**
 * Gets color coding for store count
 * Different colors based on the number of pins at a location
 * 
 * @param count - Number of pins at the location
 * @returns Color class name for styling
 */
export function getStoreCountColor(count: number): string {
  if (count === 1) {
    return 'single'; // Single pin - no special styling needed
  } else if (count <= 3) {
    return 'low'; // 2-3 pins - green
  } else if (count <= 10) {
    return 'medium'; // 4-10 pins - yellow/orange
  } else if (count <= 25) {
    return 'high'; // 11-25 pins - orange
  } else {
    return 'very-high'; // 25+ pins - red
  }
}

/**
 * Gets the appropriate size for the store marker based on count
 * 
 * @param count - Number of pins at the location
 * @returns Size class name for styling
 */
export function getStoreCountSize(count: number): string {
  if (count === 1) {
    return 'size-single';
  } else if (count <= 3) {
    return 'size-small';
  } else if (count <= 10) {
    return 'size-medium';
  } else if (count <= 25) {
    return 'size-large';
  } else {
    return 'size-very-large';
  }
}
