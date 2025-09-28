// Data conversion utilities for transforming API data to GeoJSON format
// This module handles the conversion of marker data from the API response
// into the GeoJSON format required by the map components

import { Feature, Point } from 'geojson';
import { DistriatorBusiness } from './distriatorApi';

// API marker data structure (matches WorldMapPin API)
export interface ApiMarkerData {
  id: number;
  longitude: number;
  lattitude: number; // Note: keeping the typo from the original API
  author: string;
  permlink: string;
  title: string;
  body: string;
  json_metadata?: {
    tags: string[];
    image: string[];
    location: {
      latitude: number;
      longitude: number;
    };
  };
  created: string;
  payout: number;
  votes: number;
  children: number;
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
        name: item.title || `Location ${item.id}`,
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

/**
 * Converts Distriator business data to GeoJSON format
 * This function transforms the Distriator business data into a GeoJSON FeatureCollection
 * that can be used by the map clustering components
 * 
 * @param businesses - Array of Distriator business data
 * @param reviewCounts - Map of business ID to review count
 * @param storeReviews - Map of business ID to reviews array
 * @returns Promise<GeoJSON.FeatureCollection> - GeoJSON formatted data
 */
export async function convertDistriatorBusinessesToGeojson(
  businesses: DistriatorBusiness[], 
  reviewCounts: Map<string, number> = new Map(),
  storeReviews: Map<string, any[]> = new Map()
): Promise<{
  type: "FeatureCollection";
  features: MarkerFeature[];
}> {
  // Transform the data into GeoJSON structure
  const transformedData = {
    type: "FeatureCollection" as const,
    features: businesses.map((business) => ({
      type: "Feature" as const,
      id: business.id,
      geometry: {
        type: "Point" as const,
        coordinates: [business.location.pin.longitude, business.location.pin.latitude],
      },
      properties: {
        name: business.profile.displayName,
        businessType: business.profile.businessType || 'Business',
        displayImage: business.profile.displayImage,
        images: business.profile.images,
        workTime: business.profile.workTime,
        isOnline: business.profile.isOnline,
        email: business.contact.email,
        phone: business.contact.phone,
        notes: business.contact.notes,
        instagram: business.contact.instagram,
        twitter: business.contact.twitter,
        website: business.contact.website,
        address: business.location.address,
        reviewCount: reviewCounts.get(business.id) || 0,
        reviews: storeReviews.get(business.id) || [],
        // Preserve all original properties from the API
        ...business,
      },
    })),
  };

  return transformedData;
}

