// Temporary data manager for faster development
// This loads data from the temp-distriator-data.json file

import { distriatorData, TempDistriatorData } from '../data/distriatorData';

export { TempDistriatorData };

export function loadTempData(): TempDistriatorData | null {
  try {
    console.log('📂 Loading data from JSON file...');
    console.log(`📊 Data contains: ${distriatorData.allStores.length} total stores, ${distriatorData.mappedStores.length} mapped, ${distriatorData.unmappedStores.length} unmapped`);
    console.log(`🕒 Last updated: ${distriatorData.lastUpdated}`);
    
    return distriatorData;
  } catch (error) {
    console.error('❌ Error loading temp data:', error);
    return null;
  }
}

export function saveTempData(data: TempDistriatorData): void {
  // No-op for this implementation - data is static
  console.log('💾 Data saving disabled - using static JSON file');
}

export function clearTempData(): void {
  console.log('🗑️ Cannot clear static data - using JSON file');
}

export function hasTempData(): boolean {
  // Always return true since we have the JSON file
  return true;
}
