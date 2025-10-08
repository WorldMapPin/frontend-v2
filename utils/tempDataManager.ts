// Temporary data manager for faster development
// This loads data from the temp-distriator-data.json file if it exists

import { loadDistriatorData, hasDistriatorData } from '../data/distriatorData';
import type { TempDistriatorData } from '../data/distriatorData';

export type { TempDistriatorData };

export function loadTempData(): TempDistriatorData | null {
  try {
    const data = loadDistriatorData();
    
    if (data) {
      console.log('📂 Loading data from JSON file...');
      console.log(`📊 Data contains: ${data.allStores.length} total stores, ${data.mappedStores.length} mapped, ${data.unmappedStores.length} unmapped`);
      console.log(`🕒 Last updated: ${data.lastUpdated}`);
    }
    
    return data;
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
  return hasDistriatorData();
}
