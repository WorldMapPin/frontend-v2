import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'stats-cache.json');

// Ensure directory exists
async function ensureDirectoryExists() {
  const dir = path.dirname(CACHE_FILE_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// GET: Retrieve cached stats
export async function GET(request: NextRequest) {
  try {
    await ensureDirectoryExists();
    
    // Check if we want to force refresh (bypass cache)
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    if (forceRefresh) {
      return NextResponse.json({
        success: false,
        cached: false,
        message: 'Cache refresh requested'
      });
    }
    
    try {
      const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
      const cached = JSON.parse(data);
      
      return NextResponse.json({
        success: true,
        data: cached.stats,
        lastUpdated: cached.lastUpdated,
        dataType: cached.dataType || 'full', // 'basic' or 'full'
        cached: true
      });
    } catch (error) {
      // File doesn't exist or is invalid
      return NextResponse.json({
        success: false,
        cached: false,
        message: 'No cached data available'
      });
    }
  } catch (error) {
    console.error('Error reading stats cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read cache' },
      { status: 500 }
    );
  }
}

// POST: Save stats to cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stats, dataType = 'full' } = body; // 'basic' or 'full'
    
    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Stats data is required' },
        { status: 400 }
      );
    }
    
    await ensureDirectoryExists();
    
    // Read existing cache to preserve full stats if we're only updating basic
    let existingCache = null;
    try {
      const existingData = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
      existingCache = JSON.parse(existingData);
    } catch {
      // No existing cache, that's fine
    }
    
    // If we're caching basic stats and we already have full stats, keep the full stats
    // Only update if the new data is more complete (full > basic)
    if (dataType === 'basic' && existingCache && existingCache.dataType === 'full') {
      console.log('⚠️ Keeping existing full stats, skipping basic stats cache');
      return NextResponse.json({
        success: true,
        message: 'Full stats already cached, keeping existing cache',
        lastUpdated: existingCache.lastUpdated,
        dataType: existingCache.dataType
      });
    }
    
    const cacheData = {
      stats,
      lastUpdated: new Date().toISOString(),
      dataType: dataType // 'basic' or 'full'
    };
    
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), 'utf-8');
    
    console.log(`✅ ${dataType === 'basic' ? 'Basic' : 'Full'} stats cached to file at`, new Date().toLocaleString());
    
    return NextResponse.json({
      success: true,
      message: 'Stats cached successfully',
      lastUpdated: cacheData.lastUpdated,
      dataType: cacheData.dataType
    });
  } catch (error) {
    console.error('Error saving stats cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save cache' },
      { status: 500 }
    );
  }
}

