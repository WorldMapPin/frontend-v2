// Stats API utilities for WorldMapPin
// Fetches and processes pin data to generate comprehensive statistics

import axios from 'axios';
import { BasicPinData } from './worldmappinApi';

// Import country-coder for reverse geocoding
const countryCoder = require('@rapideditor/country-coder');

// Base API URL
const BASE_API_URL = 'https://worldmappin.com/api';

function parsePostDate(rawDate?: string): Date | null {
  if (!rawDate) {
    return null;
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    normalized = `${trimmed}T00:00:00Z`;
  } else if (!trimmed.includes('T') && trimmed.includes(' ')) {
    normalized = trimmed.replace(' ', 'T');
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    console.warn('Unable to parse post date from marker/ids payload:', rawDate);
    return null;
  }

  return date;
}

const HIVE_PROGRESS_STORAGE_KEY = 'worldmappin:hive-progress:v1';
const HIVE_PROGRESS_VERSION = 1;

interface SerializedUserAgg {
  pinCount: number;
  totalPayout: number;
  totalVotes: number;
  totalComments: number;
  countries: string[];
}

interface SerializedHiveProgress {
  version: number;
  totalPins: number;
  processedCount: number;
  lastIndex: number;
  totals: {
    payout: number;
    votes: number;
    comments: number;
  };
  countryEntries: Array<[string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }]>;
  userEntries: Array<[string, SerializedUserAgg]>;
  tagEntries: Array<[string, { count: number; totalPayout: number }]>;
  dailyEntries: Array<[string, number]>;
  monthlyEntries: Array<[string, number]>;
  curatedDailyEntries: Array<[string, number]>;
  curatedMonthlyEntries: Array<[string, number]>;
  topPostsByPayout: TopPost[];
  topPostsByVotes: TopPost[];
  topPostsByComments: TopPost[];
  lastPost?: { id: number; author: string; permlink: string };
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadHiveProgress(totalPins: number): SerializedHiveProgress | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(HIVE_PROGRESS_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: SerializedHiveProgress = JSON.parse(stored);
    if (parsed.version !== HIVE_PROGRESS_VERSION) {
      window.localStorage.removeItem(HIVE_PROGRESS_STORAGE_KEY);
      return null;
    }

    if (parsed.totalPins !== totalPins) {
      window.localStorage.removeItem(HIVE_PROGRESS_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to load Hive progress state:', error);
    return null;
  }
}

function saveHiveProgress(progress: SerializedHiveProgress): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    window.localStorage.setItem(HIVE_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Failed to persist Hive progress state:', error);
  }
}

function clearHiveProgress(): void {
  if (!isBrowserEnvironment()) {
    return;
  }

  try {
    window.localStorage.removeItem(HIVE_PROGRESS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear Hive progress state:', error);
  }
}

function updateTopPosts(list: TopPost[], candidate: TopPost, key: 'payout' | 'votes' | 'comments', limit = 10) {
  const existingIndex = list.findIndex(
    item => item.author === candidate.author && item.permlink === candidate.permlink
  );

  if (existingIndex >= 0) {
    list[existingIndex] = candidate;
  } else {
    list.push(candidate);
  }

  list.sort((a, b) => {
    if (key === 'payout') {
      return b.payout - a.payout;
    }
    if (key === 'votes') {
      return b.votes - a.votes;
    }
    return b.comments - a.comments;
  });

  if (list.length > limit) {
    list.length = limit;
  }
}

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

function buildPinStatsSnapshot(params: {
  totalPins: number;
  totalPayout: number;
  totalVotes: number;
  totalComments: number;
  countryMap: Map<string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }>;
  userMap: Map<string, { pinCount: number; totalPayout: number; countries: Set<string>; totalVotes: number; totalComments: number }>;
  tagMap: Map<string, { count: number; totalPayout: number }>;
  dailyMap: Map<string, number>;
  monthlyMap: Map<string, number>;
  curatedDailyMap: Map<string, number>;
  curatedMonthlyMap: Map<string, number>;
  topPostsByPayout: TopPost[];
  topPostsByVotes: TopPost[];
  topPostsByComments: TopPost[];
}): PinStats {
  const {
    totalPins,
    totalPayout,
    totalVotes,
    totalComments,
    countryMap,
    userMap,
    tagMap,
    dailyMap,
    monthlyMap,
    curatedDailyMap,
    curatedMonthlyMap,
    topPostsByPayout,
    topPostsByVotes,
    topPostsByComments
  } = params;

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
      avgPayout: stats.pinCount > 0 ? stats.totalPayout / stats.pinCount : 0
    }))
    .sort((a, b) => b.pinCount - a.pinCount);

  const tags: TagStats[] = Array.from(tagMap.entries())
    .map(([tag, stats]) => ({
      tag,
      count: stats.count,
      totalPayout: stats.totalPayout
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const dailyStats: TimeSeriesStats[] = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthlyStats: TimeSeriesStats[] = Array.from(monthlyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const curatedDailyStats: TimeSeriesStats[] = dailyStats.map(({ date }) => ({
    date,
    count: curatedDailyMap.get(date) || 0
  }));

  const curatedMonthlyStats: TimeSeriesStats[] = monthlyStats.map(({ date }) => ({
    date,
    count: curatedMonthlyMap.get(date) || 0
  }));

  return {
    totalPins,
    totalCountries: countryMap.size,
    totalUsers: userMap.size,
    totalPayout,
    totalVotes,
    totalComments,
    avgPayoutPerPost: totalPins > 0 ? totalPayout / totalPins : 0,
    avgVotesPerPost: totalPins > 0 ? totalVotes / totalPins : 0,
    avgCommentsPerPost: totalPins > 0 ? totalComments / totalPins : 0,
    dailyStats,
    monthlyStats,
    curatedDailyStats,
    curatedMonthlyStats,
    countries,
    users,
    tags,
    topPostsByPayout: topPostsByPayout.slice(0, 10),
    topPostsByVotes: topPostsByVotes.slice(0, 10),
    topPostsByComments: topPostsByComments.slice(0, 10)
  };
}

async function persistStatsCheckpoint(
  stats: PinStats,
  dataType: 'full' | 'full-progress',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/stats-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stats, dataType, metadata })
    });
  } catch (error) {
    console.error('Error saving stats checkpoint:', error);
  }
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
    const apiUrl = `/api/hive/post?author=${encodeURIComponent(author)}&permlink=${encodeURIComponent(permlink)}`;
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
async function fetchAllPinsWithDetails(): Promise<Array<BasicPinData & FullPinData & { author: string; isCurated?: boolean }>> {
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
    const fullPins: Array<FullPinData & BasicPinData & { author: string; isCurated?: boolean }> = [];
    
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
      const mergedBatch = detailsResponse.data.map((fullPin: any, index: number) => {
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
    console.log('⚡ Starting fast basic stats fetch (WorldMapPin API only)...');
    
    // Fetch basic pin data (coordinates and IDs)
    const [allBasicPins, curatedBasicPins] = await Promise.all([
      fetchBasicPinsOnly(),
      fetchCuratedPinsOnly()
    ]);
    const curatedIdSet = new Set(curatedBasicPins.map(pin => pin.id));

    onProgress?.(20, `Loaded ${allBasicPins.length} pins. Fetching details by ID...`);
    console.log('✅ Loaded basic pin data:', allBasicPins.length, 'pins');
    
    // Fetch details by ID to get dates and post info (WorldMapPin API only)
    const batchSize = 2000;
    const allPinsWithDates: Array<BasicPinData & { postDate?: string; author?: string; isCurated?: boolean }> = [];
    const totalBatches = Math.ceil(allBasicPins.length / batchSize);
    
    for (let i = 0; i < allBasicPins.length; i += batchSize) {
      const batch = allBasicPins.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const progressPercent = 20 + Math.floor((batchNumber / totalBatches) * 60);
      
      onProgress?.(progressPercent, `Fetching details by ID: ${batchNumber}/${totalBatches} batches (${i + batch.length}/${allBasicPins.length} pins)`);
      
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
      
      // Extract date and author from ID fetch and mark curated pins using curated ID set
      const batchWithDates = detailsResponse.data.map((fullPin: any, index: number) => {
        const basicPin = batch[index];
        const match = fullPin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : '';
        
        return {
          ...basicPin,
          postDate: fullPin.postDate,
          author,
          isCurated: curatedIdSet.has(basicPin.id)
        };
      });
      
      allPinsWithDates.push(...batchWithDates);
    }
    
    onProgress?.(80, `Processing ${allPinsWithDates.length} pins...`);
    console.log('✅ Loaded post dates from ID fetch, processing statistics...');
    
    // Maps for tracking various stats
    const countryMap = new Map<string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }>();
    const userMap = new Map<string, { pinCount: number; totalPayout: number; countries: Set<string>; totalVotes: number; totalComments: number }>();
    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const curatedDailyMap = new Map<string, number>();
    const curatedMonthlyMap = new Map<string, number>();
    
    // Process all pins (including curated flag from ID fetch)
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
        
        const parsedDate = parsePostDate(pin.postDate);
        if (parsedDate) {
          const dailyKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(parsedDate.getUTCDate()).padStart(2, '0')}`;
          const monthlyKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}`;
          
          // Add to all posts time series
          dailyMap.set(dailyKey, (dailyMap.get(dailyKey) || 0) + 1);
          monthlyMap.set(monthlyKey, (monthlyMap.get(monthlyKey) || 0) + 1);
          
          // If curated, also add to curated time series
          if (pin.isCurated) {
            curatedDailyMap.set(dailyKey, (curatedDailyMap.get(dailyKey) || 0) + 1);
            curatedMonthlyMap.set(monthlyKey, (curatedMonthlyMap.get(monthlyKey) || 0) + 1);
          }
        }
      });
      
      processed += chunk.length;
      const processProgress = 80 + Math.floor((processed / allPinsWithDates.length) * 20);
      onProgress?.(processProgress, `Processing: ${processed}/${allPinsWithDates.length} pins`);
    }
    
    onProgress?.(100, 'Basic statistics ready!');
    console.log('✅ Basic stats processed (WorldMapPin API only)');
    
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
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const monthlyStats: TimeSeriesStats[] = Array.from(monthlyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Ensure curated stats include all dates from regular stats (with 0 count if no curated posts)
    const curatedDailyStats: TimeSeriesStats[] = dailyStats.map(({ date }) => ({
      date,
      count: curatedDailyMap.get(date) || 0
    }));
    
    const curatedMonthlyStats: TimeSeriesStats[] = monthlyStats.map(({ date }) => ({
      date,
      count: curatedMonthlyMap.get(date) || 0
    }));
    
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

    const [allPins, curatedPins] = await Promise.all([
      fetchAllPinsWithDetails(),
      fetchCuratedPinsWithDetails()
    ]);
    const totalPins = allPins.length;
    const curatedIdSet = new Set(curatedPins.map(pin => pin.id));

    onProgress?.(15, `Found ${totalPins} pins. Fetching detailed post data from Hive...`);
    console.log('🔄 Starting Hive data fetch for', totalPins, 'pins');

    // Load any existing aggregation state so we can resume
    const persisted = loadHiveProgress(totalPins);
    let lastProcessedPost = persisted?.lastPost;

    const countryMap = new Map<string, { count: number; totalPayout: number; totalVotes: number; totalComments: number }>(
      persisted?.countryEntries ?? []
    );
    const userMap = new Map<string, { pinCount: number; totalPayout: number; countries: Set<string>; totalVotes: number; totalComments: number }>(
      persisted?.userEntries.map(([username, stats]) => [
        username,
        {
          pinCount: stats.pinCount,
          totalPayout: stats.totalPayout,
          countries: new Set(stats.countries),
          totalVotes: stats.totalVotes,
          totalComments: stats.totalComments
        }
      ]) ?? []
    );
    const tagMap = new Map<string, { count: number; totalPayout: number }>(persisted?.tagEntries ?? []);
    const dailyMap = new Map<string, number>(persisted?.dailyEntries ?? []);
    const monthlyMap = new Map<string, number>(persisted?.monthlyEntries ?? []);
    const curatedDailyMap = new Map<string, number>(persisted?.curatedDailyEntries ?? []);
    const curatedMonthlyMap = new Map<string, number>(persisted?.curatedMonthlyEntries ?? []);

    let topPostsByPayout: TopPost[] = persisted?.topPostsByPayout ?? [];
    let topPostsByVotes: TopPost[] = persisted?.topPostsByVotes ?? [];
    let topPostsByComments: TopPost[] = persisted?.topPostsByComments ?? [];

    let totalPayout = persisted?.totals.payout ?? 0;
    let totalVotes = persisted?.totals.votes ?? 0;
    let totalComments = persisted?.totals.comments ?? 0;
    let processedCount = persisted?.processedCount ?? 0;

    let startingIndex = persisted?.lastIndex ?? 0;

    if (persisted && processedCount > 0) {
      onProgress?.(18, `Resuming from previous progress (${processedCount}/${totalPins}). Locating last processed post...`);
    }

    if (persisted?.lastPost) {
      const { id: lastId, author: lastAuthor, permlink: lastPermlink } = persisted.lastPost;
      const resumeIndex = allPins.findIndex(pin => {
        if (pin.id === lastId) {
          return true;
        }
        if (!pin.postLink || !lastPermlink) {
          return false;
        }
        const normalizedPostLink = pin.postLink.replace(/^https?:\/\/[^/]+\//i, '');
        const lastSlug = `@${lastAuthor}/${lastPermlink}`;
        if (normalizedPostLink.endsWith(lastSlug)) {
          return true;
        }
        const match = normalizedPostLink.match(/@([^/]+)\/(.+)$/);
        return !!match && match[1] === lastAuthor && match[2] === lastPermlink;
      });

      if (resumeIndex >= 0) {
        startingIndex = Math.min(resumeIndex + 1, totalPins);
        onProgress?.(20, `Resuming from @${lastAuthor}/${lastPermlink} (${processedCount}/${totalPins})`);
      } else if (persisted?.lastIndex) {
        startingIndex = Math.min(persisted.lastIndex, totalPins);
      }
    }

    startingIndex = Math.max(startingIndex, processedCount);

    const batchSize = 10;
    const totalBatches = Math.ceil(totalPins / batchSize);

    for (let i = startingIndex; i < totalPins; i += batchSize) {
      const batch = allPins.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const progressPercent = 15 + Math.floor((batchNumber / totalBatches) * 70);
      onProgress?.(progressPercent, `Fetching post details: ${batchNumber}/${totalBatches} batches (${Math.min(i + batch.length, totalPins)}/${totalPins} posts)`);

      const batchResults = await Promise.all(batch.map(async (pin) => {
        const match = pin.postLink?.match(/@([^/]+)\/(.+)$/);
        const author = match ? match[1] : pin.author;
        const permlink = match ? match[2] : '';

        if (!author || !permlink) {
          return { ...pin, author, permlink, isCurated: curatedIdSet.has(pin.id), hiveData: undefined };
        }

        const hiveData = await fetchHivePostData(author, permlink);
        return { ...pin, author, permlink, isCurated: curatedIdSet.has(pin.id), hiveData: hiveData || undefined };
      }));

      batchResults.forEach(pin => {
        processedCount += 1;

        const country = getCountryFromCoordinates(pin.lattitude, pin.longitude);

        let payout = pin.payout || 0;
        let votes = pin.votes || 0;
        let comments = pin.comments || 0;
        let tags: string[] = [];
        let title = pin.postTitle || pin.postDescription || pin.postLink || 'Untitled';
        let created = pin.postDate || ''; 

        if (pin.hiveData?.post) {
          const post = pin.hiveData.post;
          title = post.title || title;
          created = post.created || created;

          const pendingPayout = parseFloat(post.pending_payout_value || '0');
          const totalPayoutVal = parseFloat(post.total_payout_value || '0');
          const curatorPayout = parseFloat(post.curator_payout_value || '0');
          payout = pendingPayout > 0 ? pendingPayout : (totalPayoutVal + curatorPayout);

          votes = post.net_votes || 0;
          comments = post.children || 0;

          try {
            const metadata = JSON.parse(post.json_metadata || '{}');
            tags = metadata.tags || [];
          } catch (error) {
            // Ignore invalid metadata blobs
          }
        }

        totalPayout += payout;
        totalVotes += votes;
        totalComments += comments;

        if (country) {
          const countryStats = countryMap.get(country) || { count: 0, totalPayout: 0, totalVotes: 0, totalComments: 0 };
          countryStats.count += 1;
          countryStats.totalPayout += payout;
          countryStats.totalVotes += votes;
          countryStats.totalComments += comments;
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
          userStats.pinCount += 1;
          userStats.totalPayout += payout;
          userStats.totalVotes += votes;
          userStats.totalComments += comments;
          if (country) {
            userStats.countries.add(country);
          }
          userMap.set(pin.author, userStats);
        }

        tags.forEach(tag => {
          const tagStats = tagMap.get(tag) || { count: 0, totalPayout: 0 };
          tagStats.count += 1;
          tagStats.totalPayout += payout;
          tagMap.set(tag, tagStats);
        });

        const parsedDate = parsePostDate(pin.postDate || created);
        if (parsedDate) {
          const dailyKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}-${String(parsedDate.getUTCDate()).padStart(2, '0')}`;
          const monthlyKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}`;

          dailyMap.set(dailyKey, (dailyMap.get(dailyKey) || 0) + 1);
          monthlyMap.set(monthlyKey, (monthlyMap.get(monthlyKey) || 0) + 1);

          if (pin.isCurated || curatedIdSet.has(pin.id)) {
            curatedDailyMap.set(dailyKey, (curatedDailyMap.get(dailyKey) || 0) + 1);
            curatedMonthlyMap.set(monthlyKey, (curatedMonthlyMap.get(monthlyKey) || 0) + 1);
          }
        }

        const topPostCandidate: TopPost = {
          title,
          author: pin.author,
          permlink: pin.permlink || '',
          payout,
          votes,
          comments,
          created
        };

        updateTopPosts(topPostsByPayout, topPostCandidate, 'payout');
        updateTopPosts(topPostsByVotes, topPostCandidate, 'votes');
        updateTopPosts(topPostsByComments, topPostCandidate, 'comments');

        lastProcessedPost = {
          id: pin.id,
          author: pin.author,
          permlink: pin.permlink || ''
        };
      });

      const nextIndex = Math.min(totalPins, i + batch.length);
      saveHiveProgress({
        version: HIVE_PROGRESS_VERSION,
        totalPins,
        processedCount,
        lastIndex: nextIndex,
        totals: {
          payout: totalPayout,
          votes: totalVotes,
          comments: totalComments
        },
        countryEntries: Array.from(countryMap.entries()),
        userEntries: Array.from(userMap.entries()).map(([username, stats]) => ([
          username,
          {
            pinCount: stats.pinCount,
            totalPayout: stats.totalPayout,
            totalVotes: stats.totalVotes,
            totalComments: stats.totalComments,
            countries: Array.from(stats.countries)
          }
        ])),
        tagEntries: Array.from(tagMap.entries()),
        dailyEntries: Array.from(dailyMap.entries()),
        monthlyEntries: Array.from(monthlyMap.entries()),
        curatedDailyEntries: Array.from(curatedDailyMap.entries()),
        curatedMonthlyEntries: Array.from(curatedMonthlyMap.entries()),
        topPostsByPayout,
        topPostsByVotes,
        topPostsByComments,
        lastPost: lastProcessedPost
      });

      const progressStats = buildPinStatsSnapshot({
        totalPins: processedCount,
        totalPayout,
        totalVotes,
        totalComments,
        countryMap,
        userMap,
        tagMap,
        dailyMap,
        monthlyMap,
        curatedDailyMap,
        curatedMonthlyMap,
        topPostsByPayout,
        topPostsByVotes,
        topPostsByComments
      });

      await persistStatsCheckpoint(progressStats, 'full-progress', {
        processed: processedCount,
        total: totalPins,
        lastPost: lastProcessedPost
      });

      if (nextIndex < totalPins) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    onProgress?.(95, 'Finalizing statistics...');
    const finalStats = buildPinStatsSnapshot({
      totalPins,
      totalPayout,
      totalVotes,
      totalComments,
      countryMap,
      userMap,
      tagMap,
      dailyMap,
      monthlyMap,
      curatedDailyMap,
      curatedMonthlyMap,
      topPostsByPayout,
      topPostsByVotes,
      topPostsByComments
    });

    await persistStatsCheckpoint(finalStats, 'full', {
      processed: processedCount,
      total: totalPins,
      completed: true,
      lastPost: lastProcessedPost
    });

    clearHiveProgress();

    onProgress?.(100, 'Statistics ready!');

    return finalStats;
  } catch (error) {
    console.error('Error generating pin stats:', error);
    throw error;
  }
}

