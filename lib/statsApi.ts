// Stats API utilities for WorldMapPin
// Fetches and processes pin data to generate comprehensive statistics

import axios from 'axios';
import { BasicPinData } from './worldmappinApi';

// Import country-coder for reverse geocoding
const countryCoder = require('@rapideditor/country-coder');

// Base API URL
const BASE_API_URL = 'https://worldmappin.com/api';

// Interfaces for stats data
export interface TimeSeriesStats {
  date: string;
  count: number;
}

export interface CountryStats {
  country: string;
  count: number;
  totalPayout: number;
  totalVotes: number;
  totalComments: number;
}

export interface UserStats {
  username: string;
  pinCount: number;
  totalPayout: number;
  countries: number;
  totalVotes: number;
  totalComments: number;
  avgPayout: number;
}

export interface TagStats {
  tag: string;
  count: number;
  totalPayout: number;
}

export interface TopPost {
  title: string;
  author: string;
  permlink: string;
  payout: number;
  votes: number;
  comments: number;
  created: string;
}

export interface PinStats {
  totalPins: number;
  totalCountries: number;
  totalUsers: number;
  totalPayout: number;
  totalVotes: number;
  totalComments: number;
  avgPayoutPerPost: number;
  avgVotesPerPost: number;
  avgCommentsPerPost: number;
  dailyStats: TimeSeriesStats[];
  monthlyStats: TimeSeriesStats[];
  curatedDailyStats: TimeSeriesStats[];
  curatedMonthlyStats: TimeSeriesStats[];
  countries: CountryStats[];
  users: UserStats[];
  tags: TagStats[];
  topPostsByPayout: TopPost[];
  topPostsByVotes: TopPost[];
  topPostsByComments: TopPost[];
}

// Progress callback type
export type ProgressCallback = (progress: number, message: string) => void;

// Interface for full pin data from API
interface FullPinData {
  id: number;
  postTitle: string;
  postDescription: string;
  postDate: string;
  postLink: string;
  postImageLink: string;
  payout?: number;
  votes?: number;
  comments?: number;
}

// Interface for Hive post data
interface HivePostData {
  post: {
    title: string;
    author: string;
    permlink: string;
    created: string;
    body: string;
    json_metadata: string;
    pending_payout_value: string;
    total_payout_value?: string;
    curator_payout_value?: string;
    net_votes: number;
    children: number;
    author_reputation: number;
    active_votes: any[];
  };
}

// Fetch detailed post data from Hive via Next.js API route (avoids CORS)
async function fetchHivePostData(author: string, permlink: string): Promise<HivePostData | null> {
  try {
    // Use Next.js API route to avoid CORS issues
    const apiUrl = `/api/hive-post?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch post: ${author}/${permlink}`);
      return null;
    }
    
    const data: HivePostData = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching Hive post ${author}/${permlink}:`, error);
    return null;
  }
}

// Normalize country names to match GeoJSON map data
function normalizeCountryName(name: string): string {
  if (!name) return name;
  
  const normalizations: { [key: string]: string } = {
    'United States of America': 'United States',
    'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
    'Russian Federation': 'Russia',
    'Republic of Korea': 'South Korea',
    "Democratic People's Republic of Korea": 'North Korea',
    "People's Republic of China": 'China',
    'Islamic Republic of Iran': 'Iran',
    'Syrian Arab Republic': 'Syria',
    'Lao People\'s Democratic Republic': 'Laos',
    'Myanmar': 'Myanmar',
    'The Bahamas': 'Bahamas',
    'The Gambia': 'Gambia',
    'Republic of the Congo': 'Congo',
    'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
    'Dem. Rep. Congo': 'Congo, Democratic Republic of the',
    'Dem Rep Congo': 'Congo, Democratic Republic of the',
    'DR Congo': 'Congo, Democratic Republic of the',
    'D.R. Congo': 'Congo, Democratic Republic of the',
    'Republic of Moldova': 'Moldova',
    'Republic of the Philippines': 'Philippines',
    'United Republic of Tanzania': 'Tanzania',
    'Bolivarian Republic of Venezuela': 'Venezuela',
    'Kalaallit Nunaat': 'Greenland',
    'Grønland': 'Greenland',
  };
  
  if (normalizations[name]) {
    return normalizations[name];
  }
  
  let normalized = name
    .replace(/^Republic of /i, '')
    .replace(/^Kingdom of /i, '')
    .replace(/^State of /i, '')
    .replace(/^The /i, '')
    .replace(/ of America$/, '')
    .replace(/ of Great Britain and Northern Ireland$/, '')
    .trim();
  
  return normalized;
}

// Get country name from coordinates using country-coder
function getCountryFromCoordinates(lat: number, lng: number): string | null {
  try {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return null;
    }
    
    // Direct check for Greenland coordinates (approximate bounds)
    // Greenland is roughly between 59.5°N to 83.5°N and 73°W to 12°W
    // But we need to exclude Iceland which is at 63-66°N and 13-24°W
    const isInGreenlandBounds = lat >= 59.5 && lat <= 83.5 && lng >= -73 && lng <= 12;
    const isInIcelandBounds = lat >= 63 && lat <= 66.5 && lng >= -24 && lng <= -13;
    
    if (isInGreenlandBounds && !isInIcelandBounds) {
      return 'Greenland';
    }
    
    const coordinates: [number, number] = [lng, lat];
    const feature = countryCoder.feature(coordinates);
    
    if (feature && feature.properties) {
      // Check all possible property names
      const nameEn = feature.properties.nameEn || feature.properties.name_en || feature.properties.NAME_EN;
      const iso1A2 = feature.properties.iso1A2 || feature.properties.iso_1A2 || feature.properties.ISO1_A2 || feature.properties.iso1a2;
      const name = feature.properties.name || feature.properties.NAME;
      const iso31661 = feature.properties['ISO3166-1'] || feature.properties['iso3166-1'];
      
      // Check if any property contains Greenland-related terms
      const allValues = Object.values(feature.properties).map(v => String(v).toLowerCase()).join(' ');
      const isGreenland = iso1A2 === 'GL' || 
                          iso31661 === 'GL' ||
                          allValues.includes('greenland') || 
                          allValues.includes('kalaallit') || 
                          allValues.includes('grønland');
      
      // Special handling for Greenland (ISO code GL)
      if (iso1A2 === 'GL' || iso31661 === 'GL' || isGreenland) {
        return 'Greenland';
      }
      
      if (nameEn) {
        // Check if it's Greenland by name variations
        const lowerName = nameEn.toLowerCase();
        if (lowerName.includes('greenland') || lowerName.includes('kalaallit') || lowerName.includes('grønland')) {
          return 'Greenland';
        }
        
        const normalized = normalizeCountryName(nameEn);
        if (normalized.toLowerCase().includes('greenland')) {
          return 'Greenland';
        }
        
        return normalized;
      }
      
      // Fallback to 'name' property
      if (name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('greenland') || lowerName.includes('kalaallit') || lowerName.includes('grønland')) {
          return 'Greenland';
        }
        
        const normalized = normalizeCountryName(name);
        if (normalized.toLowerCase().includes('greenland')) {
          return 'Greenland';
        }
        
        return normalized;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Fetch all pins with their full details
async function fetchAllPinsWithDetails(): Promise<Array<BasicPinData & FullPinData & { author: string }>> {
  try {
    console.log('Fetching all pins from API...');
    
    // Fetch basic pin data (IDs and coordinates)
    const basicResponse = await axios.post(
      `${BASE_API_URL}/marker/0/200000/`,
      { curated_only: false },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const basicPins: BasicPinData[] = basicResponse.data;
    console.log(`Fetched ${basicPins.length} basic pins`);
    
    if (basicPins.length === 0) {
      return [];
    }
    
    // Fetch full details for all pins in batches to avoid overwhelming the API
    const batchSize = 1000;
    const fullPins: Array<FullPinData & BasicPinData & { author: string }> = [];
    
    for (let i = 0; i < basicPins.length; i += batchSize) {
      const batch = basicPins.slice(i, i + batchSize);
      const markerIds = batch.map(p => p.id);
      
      console.log(`Fetching details for batch ${Math.floor(i / batchSize) + 1} (${markerIds.length} pins)...`);
      
      const detailsResponse = await axios.post(
        `${BASE_API_URL}/marker/ids`,
        { marker_ids: markerIds },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Merge basic data with full details
      const mergedBatch = detailsResponse.data.map((fullPin: FullPinData, index: number) => {
        const basicPin = batch[index];
        const match = fullPin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : '';
        
        return {
          ...basicPin,
          ...fullPin,
          author
        };
      });
      
      fullPins.push(...mergedBatch);
    }
    
    console.log(`Successfully fetched details for ${fullPins.length} pins`);
    return fullPins;
  } catch (error) {
    console.error('Error fetching pins with details:', error);
    throw error;
  }
}

// Fetch curated pins with their full details
async function fetchCuratedPinsWithDetails(): Promise<Array<BasicPinData & FullPinData & { author: string }>> {
  try {
    console.log('Fetching curated pins from API...');
    
    // Fetch curated pin data
    const basicResponse = await axios.post(
      `${BASE_API_URL}/marker/0/150000/`,
      { curated_only: true },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const basicPins: BasicPinData[] = basicResponse.data;
    console.log(`Fetched ${basicPins.length} curated pins`);
    
    if (basicPins.length === 0) {
      return [];
    }
    
    // Fetch full details for curated pins
    const batchSize = 1000;
    const fullPins: Array<FullPinData & BasicPinData & { author: string }> = [];
    
    for (let i = 0; i < basicPins.length; i += batchSize) {
      const batch = basicPins.slice(i, i + batchSize);
      const markerIds = batch.map(p => p.id);
      
      const detailsResponse = await axios.post(
        `${BASE_API_URL}/marker/ids`,
        { marker_ids: markerIds },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const mergedBatch = detailsResponse.data.map((fullPin: FullPinData, index: number) => {
        const basicPin = batch[index];
        const match = fullPin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : '';
        
        return {
          ...basicPin,
          ...fullPin,
          author
        };
      });
      
      fullPins.push(...mergedBatch);
    }
    
    return fullPins;
  } catch (error) {
    console.error('Error fetching curated pins:', error);
    throw error;
  }
}

// Fetch basic pin data (just coordinates and IDs) - faster than full details
async function fetchBasicPinsOnly(): Promise<BasicPinData[]> {
  try {
    const response = await axios.post(
      `${BASE_API_URL}/marker/0/200000/`,
      { curated_only: false },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching basic pins:', error);
    throw error;
  }
}

// Fetch curated pin data (just coordinates and IDs) - faster
async function fetchCuratedPinsOnly(): Promise<BasicPinData[]> {
  try {
    const response = await axios.post(
      `${BASE_API_URL}/marker/0/200000/`,
      { curated_only: true },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching curated pins:', error);
    throw error;
  }
}

// Generate basic stats from WorldMapPin data only (fast)
export async function fetchBasicPinStats(onProgress?: ProgressCallback): Promise<PinStats> {
  try {
    onProgress?.(10, 'Fetching pins from WorldMapPin API...');
    console.log('⚡ Starting fast basic stats fetch...');
    
    // Fetch only basic pin data (coordinates and IDs) - much faster
    const [allBasicPins, curatedBasicPins] = await Promise.all([
      fetchBasicPinsOnly(),
      fetchCuratedPinsOnly()
    ]);
    
    onProgress?.(30, `Loaded ${allBasicPins.length} pins. Fetching post dates...`);
    console.log('✅ Loaded basic pin data:', allBasicPins.length, 'pins');
    
    // Fetch only post dates for time series (much faster than full details)
    // We'll fetch in batches but only get the dates we need
    const batchSize = 2000;
    const allPinsWithDates: Array<BasicPinData & { postDate?: string; author?: string }> = [];
    const totalBatches = Math.ceil(allBasicPins.length / batchSize);
    
    for (let i = 0; i < allBasicPins.length; i += batchSize) {
      const batch = allBasicPins.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const progressPercent = 30 + Math.floor((batchNumber / totalBatches) * 40);
      
      onProgress?.(progressPercent, `Fetching post dates: ${batchNumber}/${totalBatches} batches (${i + batch.length}/${allBasicPins.length} pins)`);
      
      const markerIds = batch.map(p => p.id);
      const detailsResponse = await axios.post(
        `${BASE_API_URL}/marker/ids`,
        { marker_ids: markerIds },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract only what we need: postDate and author
      const batchWithDates = detailsResponse.data.map((fullPin: FullPinData, index: number) => {
        const basicPin = batch[index];
        const match = fullPin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : '';
        
        return {
          ...basicPin,
          postDate: fullPin.postDate,
          author
        };
      });
      
      allPinsWithDates.push(...batchWithDates);
    }
    
    onProgress?.(75, `Processing ${allPinsWithDates.length} pins...`);
    console.log('✅ Loaded post dates, processing statistics...');
    
    // Maps for tracking various stats
    const countryMap = new Map<string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }>();
    const userMap = new Map<string, { pinCount: number; totalPayout: number; countries: Set<string>; totalVotes: number; totalComments: number }>();
    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const curatedDailyMap = new Map<string, number>();
    const curatedMonthlyMap = new Map<string, number>();
    
    // Process pins in chunks with progress updates
    const processChunkSize = 1000;
    let processed = 0;
    
    for (let i = 0; i < allPinsWithDates.length; i += processChunkSize) {
      const chunk = allPinsWithDates.slice(i, i + processChunkSize);
      
      chunk.forEach(pin => {
        const country = getCountryFromCoordinates(pin.lattitude, pin.longitude);
        
        if (country) {
          const countryStats = countryMap.get(country) || { count: 0, totalPayout: 0, totalVotes: 0, totalComments: 0 };
          countryStats.count++;
          countryMap.set(country, countryStats);
        }
        
        if (pin.author) {
          const userStats = userMap.get(pin.author) || { 
            pinCount: 0, 
            totalPayout: 0, 
            countries: new Set<string>(),
            totalVotes: 0,
            totalComments: 0
          };
          userStats.pinCount++;
          if (country) {
            userStats.countries.add(country);
          }
          userMap.set(pin.author, userStats);
        }
        
        if (pin.postDate) {
          // Parse date string carefully to avoid timezone issues
          // If postDate is "YYYY-MM-DD", parse it as local date
          let date: Date;
          if (pin.postDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Date string is in YYYY-MM-DD format, parse as local date
            const [year, month, day] = pin.postDate.split('-').map(Number);
            date = new Date(year, month - 1, day); // month is 0-indexed
          } else {
            // Try parsing as-is, but add time to avoid UTC interpretation
            date = new Date(pin.postDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
          }
          
          const dailyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          dailyMap.set(dailyKey, (dailyMap.get(dailyKey) || 0) + 1);
          monthlyMap.set(monthlyKey, (monthlyMap.get(monthlyKey) || 0) + 1);
        }
      });
      
      processed += chunk.length;
      const processProgress = 75 + Math.floor((processed / allPinsWithDates.length) * 15);
      onProgress?.(processProgress, `Processing: ${processed}/${allPinsWithDates.length} pins`);
    }
    
    // Process curated pins for time series (fetch dates only)
    onProgress?.(90, 'Processing curated posts...');
    const curatedBatchSize = 2000;
    for (let i = 0; i < curatedBasicPins.length; i += curatedBatchSize) {
      const batch = curatedBasicPins.slice(i, i + curatedBatchSize);
      const markerIds = batch.map(p => p.id);
      
      const detailsResponse = await axios.post(
        `${BASE_API_URL}/marker/ids`,
        { marker_ids: markerIds },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      detailsResponse.data.forEach((fullPin: FullPinData) => {
        if (fullPin.postDate) {
          // Parse date string carefully to avoid timezone issues
          // If postDate is "YYYY-MM-DD", parse it as local date
          let date: Date;
          if (fullPin.postDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Date string is in YYYY-MM-DD format, parse as local date
            const [year, month, day] = fullPin.postDate.split('-').map(Number);
            date = new Date(year, month - 1, day); // month is 0-indexed
          } else {
            // Try parsing as-is, but add time to avoid UTC interpretation
            date = new Date(fullPin.postDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
          }
          
          const dailyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          curatedDailyMap.set(dailyKey, (curatedDailyMap.get(dailyKey) || 0) + 1);
          curatedMonthlyMap.set(monthlyKey, (curatedMonthlyMap.get(monthlyKey) || 0) + 1);
        }
      });
    }
    
    onProgress?.(100, 'Basic statistics ready!');
    console.log('✅ Basic stats processed');
    
    // Convert maps to arrays
    const countries: CountryStats[] = Array.from(countryMap.entries())
      .map(([country, stats]) => ({
        country,
        count: stats.count,
        totalPayout: 0,
        totalVotes: 0,
        totalComments: 0
      }))
      .sort((a, b) => b.count - a.count);
    
    const users: UserStats[] = Array.from(userMap.entries())
      .map(([username, stats]) => ({
        username,
        pinCount: stats.pinCount,
        totalPayout: 0,
        countries: stats.countries.size,
        totalVotes: 0,
        totalComments: 0,
        avgPayout: 0
      }))
      .sort((a, b) => b.pinCount - a.pinCount);
    
    const dailyStats: TimeSeriesStats[] = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const monthlyStats: TimeSeriesStats[] = Array.from(monthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const curatedDailyStats: TimeSeriesStats[] = Array.from(curatedDailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const curatedMonthlyStats: TimeSeriesStats[] = Array.from(curatedMonthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    return {
      totalPins: allPinsWithDates.length,
      totalCountries: countryMap.size,
      totalUsers: userMap.size,
      totalPayout: 0,
      totalVotes: 0,
      totalComments: 0,
      avgPayoutPerPost: 0,
      avgVotesPerPost: 0,
      avgCommentsPerPost: 0,
      dailyStats,
      monthlyStats,
      curatedDailyStats,
      curatedMonthlyStats,
      countries,
      users,
      tags: [],
      topPostsByPayout: [],
      topPostsByVotes: [],
      topPostsByComments: []
    };
  } catch (error) {
    console.error('Error generating basic pin stats:', error);
    throw error;
  }
}

// Process pins to generate full statistics with Hive data (slow)
export async function fetchPinStats(onProgress?: ProgressCallback): Promise<PinStats> {
  try {
    onProgress?.(5, 'Fetching pins from WorldMapPin API...');
    
    // Fetch all pins and curated pins
    const [allPins, curatedPins] = await Promise.all([
      fetchAllPinsWithDetails(),
      fetchCuratedPinsWithDetails()
    ]);
    
    onProgress?.(15, `Found ${allPins.length} pins. Fetching detailed post data from Hive...`);
    console.log('🔄 Starting Hive data fetch for', allPins.length, 'pins');
    
    // Maps for tracking various stats
    const countryMap = new Map<string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }>();
    const userMap = new Map<string, { pinCount: number; totalPayout: number; countries: Set<string>; totalVotes: number; totalComments: number }>();
    const tagMap = new Map<string, { count: number; totalPayout: number }>();
    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const curatedDailyMap = new Map<string, number>();
    const curatedMonthlyMap = new Map<string, number>();
    
    let totalPayout = 0;
    let totalVotes = 0;
    let totalComments = 0;
    const allPostsDetailed: Array<FullPinData & BasicPinData & { author: string; hiveData?: HivePostData }> = [];
    
    // Fetch detailed Hive data in batches with progress tracking
    const batchSize = 10; // Fetch 10 posts at a time
    const totalBatches = Math.ceil(allPins.length / batchSize);
    
    for (let i = 0; i < allPins.length; i += batchSize) {
      const batch = allPins.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      const progressPercent = 15 + Math.floor((batchNumber / totalBatches) * 70);
      onProgress?.(progressPercent, `Fetching post details: ${batchNumber}/${totalBatches} batches (${i + batch.length}/${allPins.length} posts)`);
      
      const hiveDataPromises = batch.map(async (pin) => {
        // Extract author and permlink from postLink
        const match = pin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : pin.author;
        const permlink = match ? match[2] : '';
        
        if (!author || !permlink) {
          return { ...pin, author, hiveData: undefined };
        }
        
        const hiveData = await fetchHivePostData(author, permlink);
        return { ...pin, author, hiveData: hiveData || undefined };
      });
      
      const batchResults = await Promise.all(hiveDataPromises);
      allPostsDetailed.push(...batchResults);
      
      // Small delay to avoid overwhelming the API
      if (i + batchSize < allPins.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    onProgress?.(85, 'Processing statistics...');
    
    // Process all pins with detailed data
    allPostsDetailed.forEach(pin => {
      // Extract country from coordinates
      const country = getCountryFromCoordinates(pin.lattitude, pin.longitude);
      
      // Get payout and engagement from Hive data if available
      let payout = pin.payout || 0;
      let votes = pin.votes || 0;
      let comments = pin.comments || 0;
      let tags: string[] = [];
      
      if (pin.hiveData?.post) {
        const post = pin.hiveData.post;
        
        // Calculate total payout
        const pendingPayout = parseFloat(post.pending_payout_value || '0');
        const totalPayoutVal = parseFloat(post.total_payout_value || '0');
        const curatorPayout = parseFloat(post.curator_payout_value || '0');
        payout = pendingPayout > 0 ? pendingPayout : (totalPayoutVal + curatorPayout);
        
        votes = post.net_votes || 0;
        comments = post.children || 0;
        
        // Extract tags
        try {
          const metadata = JSON.parse(post.json_metadata || '{}');
          tags = metadata.tags || [];
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
      totalPayout += payout;
      totalVotes += votes;
      totalComments += comments;
      
      // Track country stats
      if (country) {
        const countryStats = countryMap.get(country) || { count: 0, totalPayout: 0, totalVotes: 0, totalComments: 0 };
        countryStats.count++;
        countryStats.totalPayout += payout;
        countryStats.totalVotes += votes;
        countryStats.totalComments += comments;
        countryMap.set(country, countryStats);
      }
      
      // Track user stats
      if (pin.author) {
        const userStats = userMap.get(pin.author) || { 
          pinCount: 0, 
          totalPayout: 0, 
          countries: new Set<string>(),
          totalVotes: 0,
          totalComments: 0
        };
        userStats.pinCount++;
        userStats.totalPayout += payout;
        userStats.totalVotes += votes;
        userStats.totalComments += comments;
        if (country) {
          userStats.countries.add(country);
        }
        userMap.set(pin.author, userStats);
      }
      
      // Track tag stats
      tags.forEach(tag => {
        const tagStats = tagMap.get(tag) || { count: 0, totalPayout: 0 };
        tagStats.count++;
        tagStats.totalPayout += payout;
        tagMap.set(tag, tagStats);
      });
      
      // Track daily and monthly stats
      if (pin.postDate) {
        // Parse date string carefully to avoid timezone issues
        // If postDate is "YYYY-MM-DD", parse it as local date
        let date: Date;
        if (pin.postDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Date string is in YYYY-MM-DD format, parse as local date
          const [year, month, day] = pin.postDate.split('-').map(Number);
          date = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          // Try parsing as-is, but add time to avoid UTC interpretation
          date = new Date(pin.postDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
        }
        
        const dailyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        dailyMap.set(dailyKey, (dailyMap.get(dailyKey) || 0) + 1);
        monthlyMap.set(monthlyKey, (monthlyMap.get(monthlyKey) || 0) + 1);
      }
    });
    
    onProgress?.(90, 'Processing curated posts...');
    
    // Process curated pins for time series
    curatedPins.forEach(pin => {
      if (pin.postDate) {
        // Parse date string carefully to avoid timezone issues
        // If postDate is "YYYY-MM-DD", parse it as local date
        let date: Date;
        if (pin.postDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Date string is in YYYY-MM-DD format, parse as local date
          const [year, month, day] = pin.postDate.split('-').map(Number);
          date = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          // Try parsing as-is, but add time to avoid UTC interpretation
          date = new Date(pin.postDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
        }
        
        const dailyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        curatedDailyMap.set(dailyKey, (curatedDailyMap.get(dailyKey) || 0) + 1);
        curatedMonthlyMap.set(monthlyKey, (curatedMonthlyMap.get(monthlyKey) || 0) + 1);
      }
    });
    
    onProgress?.(95, 'Finalizing statistics...');
    
    // Convert maps to sorted arrays
    const countries: CountryStats[] = Array.from(countryMap.entries())
      .map(([country, stats]) => ({
        country,
        count: stats.count,
        totalPayout: stats.totalPayout,
        totalVotes: stats.totalVotes,
        totalComments: stats.totalComments
      }))
      .sort((a, b) => b.count - a.count);
    
    const users: UserStats[] = Array.from(userMap.entries())
      .map(([username, stats]) => ({
        username,
        pinCount: stats.pinCount,
        totalPayout: stats.totalPayout,
        countries: stats.countries.size,
        totalVotes: stats.totalVotes,
        totalComments: stats.totalComments,
        avgPayout: stats.totalPayout / stats.pinCount
      }))
      .sort((a, b) => b.pinCount - a.pinCount);
    
    const tags: TagStats[] = Array.from(tagMap.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        totalPayout: stats.totalPayout
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 tags
    
    // Sort daily and monthly stats by date
    const dailyStats: TimeSeriesStats[] = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const monthlyStats: TimeSeriesStats[] = Array.from(monthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const curatedDailyStats: TimeSeriesStats[] = Array.from(curatedDailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    const curatedMonthlyStats: TimeSeriesStats[] = Array.from(curatedMonthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Full history
    
    // Create top posts lists
    const postsWithDetails = allPostsDetailed
      .filter(pin => pin.hiveData?.post)
      .map(pin => {
        const post = pin.hiveData!.post;
        const pendingPayout = parseFloat(post.pending_payout_value || '0');
        const totalPayoutVal = parseFloat(post.total_payout_value || '0');
        const curatorPayout = parseFloat(post.curator_payout_value || '0');
        const payout = pendingPayout > 0 ? pendingPayout : (totalPayoutVal + curatorPayout);
        
        return {
          title: post.title,
          author: post.author,
          permlink: post.permlink,
          payout,
          votes: post.net_votes,
          comments: post.children,
          created: post.created
        };
      });
    
    const topPostsByPayout = [...postsWithDetails]
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 10);
    
    const topPostsByVotes = [...postsWithDetails]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);
    
    const topPostsByComments = [...postsWithDetails]
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 10);
    
    onProgress?.(100, 'Statistics ready!');
    
    return {
      totalPins: allPins.length,
      totalCountries: countryMap.size,
      totalUsers: userMap.size,
      totalPayout,
      totalVotes,
      totalComments,
      avgPayoutPerPost: totalPayout / allPins.length,
      avgVotesPerPost: totalVotes / allPins.length,
      avgCommentsPerPost: totalComments / allPins.length,
      dailyStats,
      monthlyStats,
      curatedDailyStats,
      curatedMonthlyStats,
      countries,
      users,
      tags,
      topPostsByPayout,
      topPostsByVotes,
      topPostsByComments
    };
  } catch (error) {
    console.error('Error generating pin stats:', error);
    throw error;
  }
}

