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
 * Returns null if file doesn't exist
 */
export function loadDistriatorData(): TempDistriatorData | null {
  if (dataLoadAttempted) {
    return cachedData;
  }
  
  dataLoadAttempted = true;
  
  try {
    // Try to dynamically import the JSON file
    const tempData = require('./temp-distriator-data.json');
    cachedData = tempData as TempDistriatorData;
    
    console.log('📂 Distriator data loaded from JSON file');
    console.log(`📊 Data contains: ${cachedData.allStores.length} total stores, ${cachedData.mappedStores.length} mapped, ${cachedData.unmappedStores.length} unmapped`);
    console.log(`🕒 Last updated: ${cachedData.lastUpdated}`);
    
    return cachedData;
  } catch (error) {
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
