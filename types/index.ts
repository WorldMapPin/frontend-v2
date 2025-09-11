// Main type definitions for the map application
import { Feature, Point } from 'geojson';
import { NavigatorWithMemory } from '../utils/performanceCheck';

// Search parameters for filtering posts
export type SearchParams = {
  tags?: string[];
  author?: string;
  post_title?: string;
  start_date?: string;
  end_date?: string;
  permlink?: string;
  curated_only?: boolean;
};

// Map configuration for different map styles
export type MapConfig = {
  id: string;
  label: string;
  mapId?: string;
  mapTypeId?: string;
  styles?: google.maps.MapTypeStyle[];
};

// Marker position type
export type MarkerPosition = google.maps.LatLngLiteral;

// Info window data structure
export type InfoWindowData = {
  anchor: google.maps.marker.AdvancedMarkerElement;
  features: Feature<Point>[];
} | null;

// Performance check result
export type PerformanceResult = {
  isLowEndDevice: boolean;
  networkSpeed: number;
  memoryInfo?: NavigatorWithMemory;
};

// Global state setters are now in lib/globals.ts

// Re-export GeoJSON types
export type { Feature, Point } from 'geojson';
