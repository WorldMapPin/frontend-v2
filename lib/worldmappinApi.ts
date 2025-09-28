// WorldMapPin API utilities
// This module handles API calls to the WorldMapPin backend

import axios from 'axios';

// Base API URL
const BASE_API_URL = 'https://worldmappin.com/api';

// Interface for search parameters
export interface SearchParams {
  author?: string;
  permlink?: string;
  tags?: string[];
  curated_only?: boolean;
  start_date?: string;
}

// Interface for pin/marker data from API
export interface ApiPinData {
  id: number;
  longitude: number;
  lattitude: number; // Note: keeping the typo from the original API
  author: string;
  permlink: string;
  title: string;
  body: string;
  json_metadata: {
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
}

// Interface for ranking data
export interface RankingData {
  rank: number;
  author: string;
  tds: number;
}

// Function to fetch user pins from WorldMapPin API
export async function fetchUserPins(username: string): Promise<ApiPinData[]> {
  try {
    const searchParams: SearchParams = {
      author: username.toLowerCase()
    };

    const response = await axios.post(
      `${BASE_API_URL}/marker/0/150000/`,
      searchParams,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching user pins:', error);
    throw error;
  }
}

// Function to fetch pins by IDs
export async function fetchPinsByIds(markerIds: number[]): Promise<ApiPinData[]> {
  try {
    const response = await axios.post(
      `${BASE_API_URL}/marker/ids`,
      { marker_ids: markerIds },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching pins by IDs:', error);
    throw error;
  }
}

// Function to fetch all pins with filters
export async function fetchAllPins(searchParams: SearchParams = {}): Promise<ApiPinData[]> {
  try {
    const response = await axios.post(
      `${BASE_API_URL}/marker/0/150000/`,
      searchParams,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching all pins:', error);
    throw error;
  }
}

// Function to fetch user ranking data
export async function fetchRankingData(): Promise<RankingData[]> {
  try {
    const response = await axios.get(`${BASE_API_URL}/ranking`);
    return response.data.map((item: any) => ({
      rank: item.rank,
      author: item.author,
      tds: item.tds
    }));
  } catch (error) {
    console.error('Error fetching ranking data:', error);
    throw error;
  }
}

// Function to get user rank
export async function getUserRank(username: string): Promise<number> {
  try {
    const rankingData = await fetchRankingData();
    const userEntry = rankingData.find(
      entry => entry.author.toLowerCase() === username.toLowerCase()
    );
    return userEntry ? userEntry.rank : 0;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return 0;
  }
}

// Function to get user pin count
export async function getUserPinCount(username: string): Promise<number> {
  try {
    const pins = await fetchUserPins(username);
    return pins.length;
  } catch (error) {
    console.error('Error getting user pin count:', error);
    return 0;
  }
}
