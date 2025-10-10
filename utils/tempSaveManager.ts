// Temporary save manager for journey data
import { Journey, JourneyState } from '../types';

const TEMP_SAVE_KEY = 'worldmappin_temp_journeys';
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds
const MAX_TEMP_SAVES = 10; // Keep last 10 temp saves

interface TempSaveData {
  id: string;
  journey: Journey;
  timestamp: number;
  isAutoSave: boolean;
}

interface TempSaveState {
  currentJourney: Journey | null;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  tempSaves: TempSaveData[];
}

// Get current temp save state
const getTempSaveState = (): TempSaveState => {
  if (typeof window === 'undefined') {
    return {
      currentJourney: null,
      hasUnsavedChanges: false,
      lastSaved: null,
      tempSaves: []
    };
  }

  try {
    const stored = localStorage.getItem(TEMP_SAVE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading temp save state:', error);
  }

  return {
    currentJourney: null,
    hasUnsavedChanges: false,
    lastSaved: null,
    tempSaves: []
  };
};

// Save temp save state
const saveTempSaveState = (state: TempSaveState): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TEMP_SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving temp state:', error);
  }
};

// Create a temporary save
export const createTempSave = (journey: Journey, isAutoSave: boolean = false): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('createTempSave called with:', journey.name, 'isAutoSave:', isAutoSave);
  }
  const state = getTempSaveState();
  
  const tempSave: TempSaveData = {
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    journey: { ...journey },
    timestamp: Date.now(),
    isAutoSave
  };

  // Add to temp saves
  state.tempSaves.unshift(tempSave);
  
  // Keep only the last MAX_TEMP_SAVES
  if (state.tempSaves.length > MAX_TEMP_SAVES) {
    state.tempSaves = state.tempSaves.slice(0, MAX_TEMP_SAVES);
  }

  // Update current journey
  state.currentJourney = journey;
  state.hasUnsavedChanges = true;
  state.lastSaved = Date.now();

  saveTempSaveState(state);
  if (process.env.NODE_ENV === 'development') {
    console.log('Temp save created and stored in localStorage');
  }
};

// Get the most recent temp save
export const getLatestTempSave = (): Journey | null => {
  const state = getTempSaveState();
  return state.currentJourney;
};

// Get all temp saves for a user
export const getUserTempSaves = (username: string): TempSaveData[] => {
  const state = getTempSaveState();
  return state.tempSaves.filter(save => 
    save.journey.createdBy.toLowerCase() === username.toLowerCase()
  );
};

// Clear temp saves for a user
export const clearUserTempSaves = (username: string): void => {
  const state = getTempSaveState();
  state.tempSaves = state.tempSaves.filter(save => 
    save.journey.createdBy.toLowerCase() !== username.toLowerCase()
  );
  
  // If current journey belongs to this user, clear it
  if (state.currentJourney && 
      state.currentJourney.createdBy.toLowerCase() === username.toLowerCase()) {
    state.currentJourney = null;
    state.hasUnsavedChanges = false;
  }
  
  saveTempSaveState(state);
};

// Mark journey as saved (no longer temp)
export const markJourneyAsSaved = (journeyId: string): void => {
  const state = getTempSaveState();
  
  // Remove from temp saves
  state.tempSaves = state.tempSaves.filter(save => save.journey.id !== journeyId);
  
  // If this was the current journey, mark as saved
  if (state.currentJourney && state.currentJourney.id === journeyId) {
    state.hasUnsavedChanges = false;
  }
  
  saveTempSaveState(state);
};

// Check if there are unsaved changes
export const hasUnsavedChanges = (): boolean => {
  const state = getTempSaveState();
  return state.hasUnsavedChanges;
};

// Get last saved timestamp
export const getLastSavedTime = (): number | null => {
  const state = getTempSaveState();
  return state.lastSaved;
};

// Export journey data as JSON file
export const exportJourneyData = (journey: Journey): void => {
  const dataStr = JSON.stringify(journey, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journey_${journey.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Import journey data from JSON file
export const importJourneyData = (file: File): Promise<Journey> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate the data structure
        if (!data.id || !data.name || !data.createdBy || !data.pins) {
          throw new Error('Invalid journey data format');
        }
        
        // Generate new ID to avoid conflicts
        const journey: Journey = {
          ...data,
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        resolve(journey);
      } catch (error) {
        reject(new Error('Failed to parse journey file: ' + error));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Auto-save manager
class AutoSaveManager {
  private intervalId: NodeJS.Timeout | null = null;
  private currentJourney: Journey | null = null;
  private username: string | null = null;
  private lastJsonSave: number = 0;
  private jsonSaveInterval = 3000; // Save to JSON every 3 seconds

  start(journey: Journey, username: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('AutoSaveManager.start called with:', journey.name, username);
    }
    this.currentJourney = journey;
    this.username = username;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (this.currentJourney && this.username) {
        // Save to localStorage
        createTempSave(this.currentJourney, true);
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto-saved journey:', this.currentJourney.name);
        }
        
        // Auto-save to JSON file every 3 seconds
        const now = Date.now();
        if (now - this.lastJsonSave > this.jsonSaveInterval) {
          this.autoSaveToJsonFile(this.currentJourney, this.username);
          this.lastJsonSave = now;
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto-save skipped - no current journey or username');
        }
      }
    }, AUTO_SAVE_INTERVAL);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Auto-save interval started with interval ID:', this.intervalId);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentJourney = null;
    this.username = null;
  }

  updateJourney(journey: Journey): void {
    this.currentJourney = journey;
  }

  private autoSaveToJsonFile(journey: Journey, username: string): void {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('autoSaveToJsonFile called for:', username, journey.name);
      }
      
      // Create a data structure with metadata
      const saveData = {
        version: '1.0',
        username: username,
        timestamp: new Date().toISOString(),
        journey: journey,
        autoSave: true
      };

      // Convert to JSON
      const jsonData = JSON.stringify(saveData, null, 2);
      
      // Save to localStorage as JSON backup
      const backupKey = `journey_json_backup_${username}_${journey.id}`;
      localStorage.setItem(backupKey, jsonData);
      
      // Also save to a general backup location
      const generalBackupKey = `journey_latest_backup_${username}`;
      localStorage.setItem(generalBackupKey, jsonData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Auto-saved JSON data for:', username, journey.name);
        console.log('Backup keys created:', backupKey, generalBackupKey);
      }
    } catch (error) {
      console.error('Failed to auto-save to JSON file:', error);
    }
  }
}

export const autoSaveManager = new AutoSaveManager();

// Debug function to check localStorage contents
export const debugLocalStorage = (): void => {
  if (typeof window === 'undefined') {
    console.log('debugLocalStorage can only be called on client side');
    return;
  }
  
  console.log('=== localStorage Debug ===');
  console.log('All localStorage keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('journey') || key.includes('temp'))) {
      console.log(`Key: ${key}`);
      const value = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(value || '');
        console.log(`Value:`, parsed);
      } catch (e) {
        console.log(`Value (raw):`, value);
      }
    }
  }
  console.log('=== End Debug ===');
};

// Check if auto-save is running
export const isAutoSaveRunning = (): boolean => {
  return autoSaveManager['intervalId'] !== null;
};

// Get auto-save status
export const getAutoSaveStatus = (): { isRunning: boolean; currentJourney: string | null; username: string | null } => {
  return {
    isRunning: isAutoSaveRunning(),
    currentJourney: autoSaveManager['currentJourney']?.name || null,
    username: autoSaveManager['username'] || null
  };
};

// Load journey from JSON backup
export const loadJourneyFromJsonBackup = (username: string, journeyId: string): Journey | null => {
  try {
    const backupKey = `journey_json_backup_${username}_${journeyId}`;
    const jsonData = localStorage.getItem(backupKey);
    
    if (jsonData) {
      const data = JSON.parse(jsonData);
      if (data.journey && data.version === '1.0') {
        return data.journey;
      }
    }
  } catch (error) {
    console.error('Failed to load journey from JSON backup:', error);
  }
  
  return null;
};

// Load latest journey backup for user
export const loadLatestJourneyBackup = (username: string): Journey | null => {
  try {
    const backupKey = `journey_latest_backup_${username}`;
    const jsonData = localStorage.getItem(backupKey);
    
    if (jsonData) {
      const data = JSON.parse(jsonData);
      if (data.journey && data.version === '1.0') {
        return data.journey;
      }
    }
  } catch (error) {
    console.error('Failed to load latest journey backup:', error);
  }
  
  return null;
};

// Export all user data as JSON (for manual backup)
export const exportAllUserData = (username: string): void => {
  try {
    // Get all journey backups for this user
    const allBackups: any[] = [];
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`journey_json_backup_${username}_`)) {
        const jsonData = localStorage.getItem(key);
        if (jsonData) {
          try {
            const data = JSON.parse(jsonData);
            allBackups.push(data);
          } catch (e) {
            // Skip invalid data
          }
        }
      }
    }
    
    // Create export data
    const exportData = {
      version: '1.0',
      username: username,
      exportDate: new Date().toISOString(),
      totalJourneys: allBackups.length,
      journeys: allBackups.map(backup => backup.journey)
    };
    
    // Convert to JSON and download
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `worldmappin_all_data_${username}_${new Date().toISOString().slice(0, 10)}.json`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('Exported all data for user:', username);
  } catch (error) {
    console.error('Failed to export all user data:', error);
  }
};
