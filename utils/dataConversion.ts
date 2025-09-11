// Data conversion utilities for transforming API data to GeoJSON format
// This module handles the conversion of marker data from the API response
// into the GeoJSON format required by the map components

import { Feature, Point } from 'geojson';

// API marker data structure
export interface ApiMarkerData {
  id: number;
  longitude: number;
  lattitude: number;
  [key: string]: any; // Allow for additional properties
}

// GeoJSON feature with custom properties
export interface MarkerFeature extends Feature<Point> {
  id: string;
  properties: {
    name: string;
    [key: string]: any; // Allow for additional properties from API
  };
}

/**
 * Converts API marker data to GeoJSON format
 * This function transforms the raw API response into a GeoJSON FeatureCollection
 * that can be used by the map clustering components
 * 
 * @param data - Array of marker data from the API
 * @returns Promise<GeoJSON.FeatureCollection> - GeoJSON formatted data
 */
export async function convertDatafromApitoGeojson(data: ApiMarkerData[]): Promise<{
  type: "FeatureCollection";
  features: MarkerFeature[];
}> {
  // Start the timer for performance monitoring
  // const startTime = Date.now();

  // Transform the data into GeoJSON structure
  const transformedData = {
    type: "FeatureCollection" as const,
    features: data.map((item) => ({
      type: "Feature" as const,
      id: `${item.id}`,
      geometry: {
        type: "Point" as const,
        coordinates: [item.longitude, item.lattitude],
      },
      properties: {
        name: `Location ${item.id}`,
        // Preserve all original properties from the API
        ...item,
      },
    })),
  };

  // End the timer and log performance
  // const endTime = Date.now();
  // const executionTime = (endTime - startTime) / 1000;
  // console.log(`Data transformation completed in ${executionTime.toFixed(2)} seconds`);

  return transformedData;
}

