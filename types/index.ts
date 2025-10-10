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

// Community data structure
export type Community = {
  id: string;
  name: string;
  description?: string;
  apiEndpoint?: string;
  isDefault?: boolean;
  tag?: string; // Added for tag-based filtering
};

// Info window data structure
export type InfoWindowData = {
  anchor: google.maps.marker.AdvancedMarkerElement;
  features: Feature<Point>[];
  isCluster?: boolean; // Added for cluster info window
} | null;

// Performance check result
export type PerformanceResult = {
  isLowEndDevice: boolean;
  networkSpeed: number;
  memoryInfo?: NavigatorWithMemory;
};

// Global state setters are now in lib/globals.ts

// Journey-related types
export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' | 'FLYING';

export type JourneyPinType = 'post' | 'snap' | 'placeholder' | 'future-post';

export type JourneyPin = {
  id: string;
  position: MarkerPosition;
  title: string;
  description?: string;
  order: number; // Order in the journey
  pinType: JourneyPinType; // Type of pin
  postId?: number; // If linked to existing post
  postPermlink?: string; // Permlink to the post
  postAuthor?: string; // Author of the post
  imageUrl?: string; // For snap type pins
  imageCaption?: string; // Caption for snap images
};

export type JourneySegment = {
  id: string;
  fromPinId: string;
  toPinId: string;
  travelMode: TravelMode;
  order: number;
};

export type Journey = {
  id: string;
  name: string;
  description?: string;
  pins: JourneyPin[];
  segments: JourneySegment[];
  defaultTravelMode: TravelMode; // Default for new segments
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type JourneyState = {
  journeys: Journey[];
  currentJourney: Journey | null;
  editableUsers: string[];
  activeUser: string;
  isEditMode: boolean; // New: toggle between view and edit mode
};

// Mock pin for testing
export type MockPin = {
  id: string;
  position: MarkerPosition;
  title: string;
  description?: string;
};

// Re-export GeoJSON types
export type { Feature, Point } from 'geojson';
