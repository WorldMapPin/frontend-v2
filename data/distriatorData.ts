// Import the actual data from the JSON file
import tempData from './temp-distriator-data.json';

export interface TempDistriatorData {
  mappedStores: any[];
  unmappedStores: any[];
  allStores: any[];
  storeReviews: Record<string, any[]>;
  reviewCounts: Record<string, number>;
  lastUpdated: string | null;
}

// Export the data directly
export const distriatorData: TempDistriatorData = tempData as TempDistriatorData;

console.log('📂 Distriator data loaded from JSON file');
console.log(`📊 Data contains: ${distriatorData.allStores.length} total stores, ${distriatorData.mappedStores.length} mapped, ${distriatorData.unmappedStores.length} unmapped`);
console.log(`🕒 Last updated: ${distriatorData.lastUpdated}`);
