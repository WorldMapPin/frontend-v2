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

// Interface for basic pin data (from marker search endpoint)
export interface BasicPinData {
  id: number;
  longitude: number;
  lattitude: number; // Note: keeping the typo from the original API
}

// Interface for full pin/marker data from API (from marker/ids endpoint)
export interface ApiPinData {
  id: number;
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

// Function to fetch basic user pin data (IDs and coordinates only)
// This endpoint returns: [{ id: number, longitude: number, lattitude: number }, ...]
export async function fetchUserPins(username: string): Promise<BasicPinData[]> {
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

    console.log('fetchUserPins: Fetched', response.data.length, 'pins for', username);

    return response.data;
  } catch (error) {
    console.error('Error fetching user pins:', error);
    throw error;
  }
}

// Function to fetch user posts with full details AND coordinates in one call
// This is more reliable than the two-step process since we get everything together
export async function fetchUserPostsWithCoords(username: string): Promise<any[]> {
  try {
    console.log('========================================');
    console.log('fetchUserPostsWithCoords: Fetching all data for', username);
    
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

    const posts = response.data;
    console.log('fetchUserPostsWithCoords: Received', posts.length, 'posts');
    
    // Now get full post details for all IDs
    if (posts.length === 0) {
      return [];
    }
    
    const markerIds = posts.map((p: BasicPinData) => p.id);
    const fullPostsResponse = await axios.post(
      `${BASE_API_URL}/marker/ids`,
      { marker_ids: markerIds },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const fullPosts = fullPostsResponse.data;
    console.log('fetchUserPostsWithCoords: Received', fullPosts.length, 'full posts');
    
    // CRITICAL: Sort fullPosts by date descending (newest first)
    fullPosts.sort((a: any, b: any) => {
      const dateA = new Date(a.postDate || 0).getTime();
      const dateB = new Date(b.postDate || 0).getTime();
      return dateB - dateA;
    });
    
    // CRITICAL: Also sort posts (coordinates) by ID descending
    // Assuming higher IDs = newer posts (this is typically how databases work)
    posts.sort((a: BasicPinData, b: BasicPinData) => {
      return b.id - a.id; // Descending by ID
    });
    
    console.log('fetchUserPostsWithCoords: Sorted coordinates by ID (descending):');
    console.log('  IDs:', posts.map(p => p.id).join(', '));
    
    console.log('fetchUserPostsWithCoords: Sorted posts by date (descending):');
    fullPosts.forEach((post: any, idx: number) => {
      const match = post.postLink?.match(/@([^/]+)\/(.+)$/);
      const permlink = match ? match[2].substring(0, 40) : 'unknown';
      console.log(`  [${idx}] ${post.postDate} - ${permlink}...`);
    });
    
    // Now both arrays should be sorted in the same chronological order (newest first)
    // Match them by index
    const merged = fullPosts.map((post: any, index: number) => {
      const coords = posts[index];
      
      if (!coords) {
        console.error('No coords for index', index);
        return null;
      }
      
      const match = post.postLink?.match(/@([^/]+)\/(.+)$/);
      const author = match ? match[1] : '';
      const permlink = match ? match[2] : '';
      
      console.log(`  ✓ Matched: Pin ID ${coords.id} -> "${post.postTitle?.substring(0, 30)}..." (${post.postDate})`);
      
      return {
        id: coords.id,
        longitude: coords.longitude,
        lattitude: coords.lattitude,
        title: post.postTitle || 'Untitled',
        author: author,
        permlink: permlink,
        image: post.postImageLink,
        created: post.postDate,
        description: post.postDescription,
        link: post.postLink,
        ...post
      };
    }).filter(Boolean);
    
    console.log('fetchUserPostsWithCoords: Successfully merged', merged.length, 'posts');
    console.log('========================================');
    
    return merged;
  } catch (error) {
    console.error('Error fetching user posts with coords:', error);
    throw error;
  }
}

// Function to fetch pins by IDs
// Note: This endpoint returns posts with fields like: postTitle, postImageLink, postDescription, postDate, postLink
// The response does NOT include ID fields, and order may not match the request order
export async function fetchPinsByIds(markerIds: number[]): Promise<any[]> {
  try {
    console.log('========================================');
    console.log('fetchPinsByIds: Requesting IDs:', markerIds);
    
    const response = await axios.post(
      `${BASE_API_URL}/marker/ids`,
      { marker_ids: markerIds },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('fetchPinsByIds: Received', response.data.length, 'posts');
    
    // Log all permlinks in response order to understand API ordering
    console.log('fetchPinsByIds: Response order (by permlink):');
    response.data.forEach((post: any, idx: number) => {
      if (post.postLink) {
        const match = post.postLink.match(/@([^/]+)\/(.+)$/);
        const permlink = match ? match[2] : 'unknown';
        console.log(`  [${idx}] ${permlink.substring(0, 50)}... (date: ${post.postDate})`);
      }
    });
    console.log('========================================');

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
