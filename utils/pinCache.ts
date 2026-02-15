import { openDB, DBSchema } from 'idb';
import { SearchParams } from '../types';

interface PinCacheSchema extends DBSchema {
    pins: {
        key: string;
        value: {
            data: any;
            timestamp: number;
        };
    };
}

const DB_NAME = 'worldmappin_cache';
const STORE_NAME = 'pins';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

class PinCache {
    private dbPromise;

    constructor() {
        if (typeof window !== 'undefined') {
            this.dbPromise = openDB<PinCacheSchema>(DB_NAME, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                },
            });
        }
    }

    private getCacheKey(communityId: string, params: SearchParams): string {
        // Sort keys to ensure consistent cache keys regardless of parameter order
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = (params as any)[key];
                return acc;
            }, {} as any);

        return `pins_${communityId}_${JSON.stringify(sortedParams)}`;
    }

    async getCachedPins(communityId: string, params: SearchParams): Promise<any | null> {
        if (!this.dbPromise) return null;

        try {
            const db = await this.dbPromise;
            const key = this.getCacheKey(communityId, params);
            console.log(`[PinCache] Requesting cached pins for key: ${key}`);

            const cached = await db.get(STORE_NAME, key);

            if (!cached) {
                console.log(`[PinCache] Cache MISS for key: ${key}`);
                return null;
            }

            const now = Date.now();
            const age = now - cached.timestamp;
            if (age > CACHE_TTL) {
                console.log(`[PinCache] Cache EXPIRED for key: ${key} (Age: ${age}ms, TTL: ${CACHE_TTL}ms)`);
                await db.delete(STORE_NAME, key);
                return null;
            }

            console.log(`[PinCache] Cache HIT for key: ${key} (Age: ${age}ms)`);
            return cached.data;
        } catch (error) {
            console.error('[PinCache] Error getting cache:', error);
            return null;
        }
    }

    async setCachedPins(communityId: string, params: SearchParams, data: any): Promise<void> {
        if (!this.dbPromise) return;

        try {
            const db = await this.dbPromise;
            const key = this.getCacheKey(communityId, params);

            console.log(`[PinCache] Caching data for key: ${key}`);
            await db.put(STORE_NAME, {
                data,
                timestamp: Date.now(),
            }, key);

            console.log(`[PinCache] Successfully cached ${key}`);
        } catch (error) {
            console.error('[PinCache] Error setting cache:', error);
        }
    }

    async clearPinCache(): Promise<void> {
        if (!this.dbPromise) return;

        try {
            const db = await this.dbPromise;
            await db.clear(STORE_NAME);
            console.log('[PinCache] Cache cleared');
        } catch (error) {
            console.error('[PinCache] Error clearing cache:', error);
        }
    }
}

export const pinCache = new PinCache();
