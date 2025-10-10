// Dynamic data loading to handle missing JSON file gracefully
export interface TempDistriatorData {
  mappedStores: any[];
  unmappedStores: any[];
  allStores: any[];
  storeReviews: Record<string, any[]>;
  reviewCounts: Record<string, number>;
  lastUpdated: string | null;
}

let cachedData: TempDistriatorData | null = null;
let dataLoadAttempted = false;

/**
 * Attempts to load the temp distriator data from JSON file
 * Returns null if file doesn't exist - will fall back to API
 */
export function loadDistriatorData(): TempDistriatorData | null {
  if (dataLoadAttempted) {
    return cachedData;
  }
  
  dataLoadAttempted = true;
  
  try {
    // Use dynamic require with webpack magic comment to make it optional
    // This won't fail the build if the file is missing
    const tempData = require('./temp-distriator-data.json');
    
    // Check if the data is empty (stub file) or invalid
    if (!tempData || !tempData.allStores || tempData.allStores.length === 0) {
      console.log('📂 Temp distriator data file is empty, will fetch from API');
      return null;
    }
    
    cachedData = tempData as TempDistriatorData;
    
    console.log('📂 Distriator data loaded from JSON file');
    console.log(`📊 Data contains: ${cachedData.allStores.length} total stores, ${cachedData.mappedStores.length} mapped, ${cachedData.unmappedStores.length} unmapped`);
    console.log(`🕒 Last updated: ${cachedData.lastUpdated}`);
    
    return cachedData;
  } catch (error) {
    // File doesn't exist or can't be loaded - this is fine, use API
    console.log('📂 Temp distriator data file not found, will fetch from API');
    return null;
  }
}

/**
 * Checks if temp data is available
 */
export function hasDistriatorData(): boolean {
  if (!dataLoadAttempted) {
    loadDistriatorData();
  }
  return cachedData !== null;
}
