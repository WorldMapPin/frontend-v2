// Community API service for fetching community-specific pins
// This module handles API calls to different community endpoints

import axios from 'axios';
import { Community } from '../types';
import { convertDatafromApitoGeojson, convertDistriatorBusinessesToGeojson } from './dataConversion';
import { fetchAllDistriatorBusinesses, DistriatorFetchResult } from './distriatorApi';

// Default communities configuration
export const COMMUNITIES: Community[] = [
  {
    id: 'default',
    name: 'WorldMapPin',
    description: 'Default community pins',
    isDefault: true
  },
  {
    id: 'spendhbd',
    name: 'SpendHBD Stores',
    description: 'HBD purchase locations and stores',
    isDefault: false,
    tag: 'spendhbd'
  },
  {
    id: 'foodie',
    name: 'Foodies Bee Hive',
    description: 'Food-related pins and restaurants',
    isDefault: false,
    tag: 'FOODIE'
  }
];

/**
 * Fetches pins from a specific community API endpoint
 * @param community - The community to fetch pins from
 * @returns Promise<GeoJSON.FeatureCollection> - GeoJSON formatted data
 */
export async function fetchCommunityPins(community: Community): Promise<{
  type: "FeatureCollection";
  features: any[];
}> {
  try {
    console.log(`Fetching pins for community: ${community.name}`);
    
    // Handle SpendHBD community with Distriator API
    if (community.id === 'spendhbd') {
      console.log('Fetching Distriator businesses...');
      const result = await fetchAllDistriatorBusinesses();
      
      console.log(`Fetched ${result.allStores.length} total stores: ${result.mappedStores.length} mapped, ${result.unmappedStores.length} unmapped`);
      console.log(`Reviews fetched for ${result.storeReviews.size} stores`);
      
      // Log full store arrays for debugging
      console.log('Full all stores array:', result.allStores);
      console.log('Mapped stores array:', result.mappedStores);
      console.log('Unmapped stores array:', result.unmappedStores);
      
      // Log unmapped stores for debugging
      if (result.unmappedStores.length > 0) {
        console.log('Unmapped stores (no valid coordinates):', result.unmappedStores.map(s => s.profile.displayName));
      }
      
      // Convert only mapped stores to GeoJSON format
      const geoJsonData = await convertDistriatorBusinessesToGeojson(result.mappedStores, result.reviewCounts, result.storeReviews);
      console.log(`GeoJSON data converted for ${community.name}:`, geoJsonData.features?.length || 0, 'features');
      
      return geoJsonData;
    }
    
    // Handle other communities with existing logic
    let response;
    
    // Handle Foodies Bee Hive community with FOODIE tag filtering
    if (community.id === 'foodie') {
      console.log('Fetching food-related pins with FOODIE tag...');
      // Use the default WorldMapPin API but filter by FOODIE tag
      response = await axios.post(`https://worldmappin.com/api/marker/0/150000/`, {
        tags: ['FOODIE'],
        curated_only: false
      });
      
      console.log(`Fetched ${response.data?.length || 0} food-related pins for ${community.name}`);
      
      // Convert to GeoJSON format
      const geoJsonData = await convertDatafromApitoGeojson(response.data || []);
      console.log(`GeoJSON data converted for ${community.name}:`, geoJsonData.features?.length || 0, 'features');
      
      return geoJsonData;
    }
    
    if (community.isDefault) {
      // Use the default WorldMapPin API
      response = await axios.post(`https://worldmappin.com/api/marker/0/150000/`, { curated_only: false });
    } else if (community.apiEndpoint) {
      // Use the community-specific API endpoint
      response = await axios.get(community.apiEndpoint);
    } else if (community.tag) {
      // Use WorldMapPin API with specific tag
      response = await axios.post(`https://worldmappin.com/api/marker/0/150000/`, { 
        tags: [community.tag],
        curated_only: false 
      });
    } else {
      throw new Error(`No API endpoint or tag configured for community: ${community.name}`);
    }
    
    console.log(`API response received for ${community.name}:`, response.data?.length || 0, 'markers');
    
    // Convert the response data to GeoJSON format
    const geoJsonData = await convertDatafromApitoGeojson(response.data);
    console.log(`GeoJSON data converted for ${community.name}:`, geoJsonData.features?.length || 0, 'features');
    
    return geoJsonData;
  } catch (error) {
    console.error(`Error fetching pins for community ${community.name}:`, error);
    throw error;
  }
}

/**
 * Gets the default community
 * @returns Community - The default community
 */
export function getDefaultCommunity(): Community {
  return COMMUNITIES.find(c => c.isDefault) || COMMUNITIES[0];
}

/**
 * Gets a community by ID
 * @param id - The community ID
 * @returns Community | undefined - The community or undefined if not found
 */
export function getCommunityById(id: string): Community | undefined {
  return COMMUNITIES.find(c => c.id === id);
}

/**
 * Fetches Distriator data with detailed breakdown (for debugging)
 * @returns Promise<DistriatorFetchResult> - Complete Distriator data with mapped/unmapped stores
 * 
 * Usage example:
 * const data = await fetchDistriatorDataForDebugging();
 * console.log('All stores:', data.allStores.length);
 * console.log('Mapped stores:', data.mappedStores.length);
 * console.log('Unmapped stores:', data.unmappedStores.length);
 * console.log('Stores with reviews:', data.storeReviews.size);
 */
export async function fetchDistriatorDataForDebugging(): Promise<DistriatorFetchResult> {
  return await fetchAllDistriatorBusinesses();
}
