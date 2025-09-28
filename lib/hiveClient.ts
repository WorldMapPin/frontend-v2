// Hive blockchain client utilities
// This module handles connection to Hive nodes and provides methods for fetching user data

// List of available Hive API nodes
const hiveNodes = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.openhive.network',
  'https://techcoderx.com',
  'https://api.c0ff33a.uk',
  'https://hive-api.3speak.tv',
  'https://hiveapi.actifit.io',
  'https://rpc.mahdiyari.info',
  'https://hive-api.dlux.io'
];

// Function to check if a node is available
async function checkNodeAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        jsonrpc: '2.0', 
        method: 'condenser_api.get_version', 
        params: [], 
        id: 1 
      })
    });

    if (response.ok) {
      const data = await response.json();
      return true;
    }
  } catch (error) {
    console.log(`Node ${url} is not available:`, error);
  }
  return false;
}

// Function to find the first available node
async function getAvailableNode(): Promise<string> {
  for (const node of hiveNodes) {
    const isAvailable = await checkNodeAvailability(node);
    if (isAvailable) {
      return node;
    }
  }
  throw new Error('No available Hive nodes found.');
}

// Cached node URL to avoid repeated checks
let cachedNode: string | null = null;

// Function to initialize the client with an available node
export async function initializeHiveClient(): Promise<string> {
  try {
    if (cachedNode) {
      return cachedNode;
    }
    
    const availableNode = await getAvailableNode();
    cachedNode = availableNode;
    console.log(`Hive client initialized with node: ${availableNode}`);
    return availableNode;
  } catch (error) {
    console.error('Failed to initialize Hive client:', error);
    throw error;
  }
}

// Function to make API calls to Hive
export async function hiveApiCall(method: string, params: any[]): Promise<any> {
  const nodeUrl = await initializeHiveClient();
  
  const response = await fetch(nodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Hive API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Hive API error: ${data.error.message}`);
  }

  return data.result;
}

// Function to lookup accounts
export async function lookupAccounts(username: string, max: number = 1): Promise<string[]> {
  return hiveApiCall('condenser_api.lookup_accounts', [username, max]);
}

// Function to get account details
export async function getAccounts(usernames: string[]): Promise<any[]> {
  return hiveApiCall('condenser_api.get_accounts', [usernames]);
}

// Interface for user profile data
export interface HiveUserProfile {
  name?: string;
  about?: string;
  location?: string;
  website?: string;
  profile_image?: string;
}

// Function to fetch user profile from Hive blockchain
export async function fetchUserProfile(username: string): Promise<{
  exists: boolean;
  profile?: HiveUserProfile;
  profilePicture?: string;
}> {
  try {
    const accounts = await lookupAccounts(username.toLowerCase(), 1);
    
    if (accounts.length === 0) {
      return { exists: false };
    }

    const accountDetails = await getAccounts(accounts);
    
    if (accountDetails.length === 0) {
      return { exists: false };
    }

    const account = accountDetails[0];
    const metadata = account.posting_json_metadata;
    
    if (!metadata) {
      return { 
        exists: true, 
        profile: {}, 
        profilePicture: '/images/worldmappin-logo.png' 
      };
    }

    const parsedMetadata = JSON.parse(metadata);
    const userProfile = parsedMetadata.profile || {};
    
    return {
      exists: true,
      profile: {
        name: userProfile.name || account.name || username,
        about: userProfile.about || 'No description available',
        location: userProfile.location || 'Location not specified',
        website: userProfile.website || '',
        profile_image: userProfile.profile_image
      },
      profilePicture: userProfile.profile_image || '/images/worldmappin-logo.png'
    };
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { exists: false };
  }
}
