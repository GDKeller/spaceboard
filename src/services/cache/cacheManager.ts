import { CACHE_CONFIG } from '../../config/cache.config';
import { filesystemCache, FilesystemCache, CacheStats } from './filesystemCache';
import { assetCache, AssetCache, AssetCacheStats } from './assetCache';
import { astronautCache } from '../cache/browserCache'; // Existing browser cache
import { rateLimiter } from '../../utils/rateLimiter';

export interface CacheManagerStats {
  filesystem: CacheStats;
  assets: AssetCacheStats;
  browser: {
    size: number;
    hitRate: number;
  };
  rateLimiting: Record<string, any>;
}

export interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
  useAssetCache?: boolean;
  metadata?: Record<string, any>;
}

export interface FetchOptions extends CacheOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  onRetry?: (attempt: number, retryAfter: number) => void;
}

export class CacheManager {
  private fsCache: FilesystemCache;
  private assetCacheInstance: AssetCache;
  private browserCache: any; // Existing browser cache
  private assetFetchPromises = new Map<string, Promise<string>>(); // Deduplicate concurrent asset fetches
  
  constructor() {
    this.fsCache = filesystemCache;
    this.assetCacheInstance = assetCache;
    this.browserCache = astronautCache;
    
    // Schedule periodic cleanup - disabled to prevent potential issues
    // this.scheduleCleanup();
  }

  private scheduleCleanup(): void {
    // Run cleanup every hour - currently disabled
    // setInterval(() => {
    //   this.cleanup();
    // }, 60 * 60 * 1000);
  }

  /**
   * Comprehensive data fetching with multi-layer caching
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      forceRefresh = false,
      timeout = 10000,
      retries = 3,
      onProgress,
      onRetry
    } = options;

    // If force refresh, clear all cache layers
    if (forceRefresh) {
      await this.clearKey(key);
    }

    // Layer 1: Browser cache (fastest)
    if (!forceRefresh) {
      try {
        const browserData = await this.browserCache.get(key);
        if (browserData !== null) {
          console.log(`[CacheManager] Browser cache hit for: ${key}`);
          return browserData;
        }
      } catch (error) {
        console.warn('[CacheManager] Browser cache error:', error);
      }
    }

    // Layer 2: Filesystem cache (persistent)
    if (!forceRefresh) {
      try {
        const fsData = await this.fsCache.get<T>(key);
        if (fsData !== null) {
          console.log(`[CacheManager] Filesystem cache hit for: ${key}`);
          
          // Update browser cache for faster access
          try {
            await this.browserCache.set(key, fsData, { ttl });
          } catch (error) {
            console.warn('[CacheManager] Failed to update browser cache:', error);
          }
          
          return fsData;
        }
      } catch (error) {
        console.warn('[CacheManager] Filesystem cache error:', error);
      }
    }

    // Layer 3: Fetch from source with rate limiting
    console.log(`[CacheManager] Cache miss for: ${key}, fetching from source`);
    
    const fetchOperation = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const data = await fetcher();
        clearTimeout(timeoutId);
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
    };

    try {
      const data = await rateLimiter.withRateLimit(
        key,
        fetchOperation,
        { maxRetries: retries, onRetry }
      );

      // Store in both cache layers
      await this.storeInAllLayers(key, data, { ttl, ...options });
      
      return data;
    } catch (error) {
      console.error(`[CacheManager] Failed to fetch ${key}:`, error);
      
      // Try to return stale data as fallback
      const staleData = await this.getStaleData<T>(key);
      if (staleData !== null) {
        console.warn(`[CacheManager] Returning stale data for: ${key}`);
        return staleData;
      }
      
      throw error;
    }
  }

  /**
   * Asset-specific caching with media optimization
   */
  async fetchAsset(url: string, options: CacheOptions = {}): Promise<string> {
    const {
      ttl = CACHE_CONFIG.ASSET_TTL,
      forceRefresh = false,
      useAssetCache = true
    } = options;

    if (!useAssetCache) {
      return url; // Return original URL without caching
    }

    // Check if we're already fetching this URL
    const existingPromise = this.assetFetchPromises.get(url);
    if (existingPromise && !forceRefresh) {
      console.log(`[CacheManager] Reusing existing fetch promise for: ${url}`);
      return existingPromise;
    }

    // Create a new fetch promise
    const fetchPromise = (async () => {
      try {
        if (forceRefresh) {
          await this.assetCacheInstance.delete(url);
        }

        // Get cached URL - this now returns stable URLs
        const cachedUrl = await this.assetCacheInstance.getCachedAssetUrl(url);
        return cachedUrl;
      } catch (error) {
        console.warn('[CacheManager] Asset cache error:', error);
        return url; // Fallback to original URL
      } finally {
        // Clean up the promise map after a short delay
        setTimeout(() => {
          this.assetFetchPromises.delete(url);
        }, 100);
      }
    })();

    // Store the promise for deduplication
    this.assetFetchPromises.set(url, fetchPromise);
    
    return fetchPromise;
  }

  /**
   * Compare and update with change detection
   */
  async compareAndUpdate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchOptions = {}
  ): Promise<{ data: T; wasUpdated: boolean }> {
    try {
      const newData = await fetcher();
      
      // Check if filesystem cache has this data and if it's different
      const wasUpdated = await this.fsCache.compareAndUpdate(key, newData, options);
      
      if (wasUpdated) {
        // Update browser cache too
        try {
          await this.browserCache.set(key, newData, options);
        } catch (error) {
          console.warn('[CacheManager] Failed to update browser cache:', error);
        }
        
        console.log(`[CacheManager] Data updated for: ${key}`);
      } else {
        console.log(`[CacheManager] No changes detected for: ${key}`);
      }
      
      return { data: newData, wasUpdated };
    } catch (error) {
      console.error(`[CacheManager] Compare and update failed for ${key}:`, error);
      
      // Try to return existing cached data
      const existingData = await this.get<T>(key);
      if (existingData !== null) {
        return { data: existingData, wasUpdated: false };
      }
      
      throw error;
    }
  }

  /**
   * Get data from any cache layer
   */
  async get<T>(key: string): Promise<T | null> {
    // Try browser cache first
    try {
      const browserData = await this.browserCache.get(key);
      if (browserData !== null) {
        return browserData;
      }
    } catch (error) {
      console.warn('[CacheManager] Browser cache get error:', error);
    }

    // Try filesystem cache
    try {
      const fsData = await this.fsCache.get<T>(key);
      if (fsData !== null) {
        // Update browser cache
        try {
          await this.browserCache.set(key, fsData);
        } catch (error) {
          console.warn('[CacheManager] Failed to sync to browser cache:', error);
        }
        return fsData;
      }
    } catch (error) {
      console.warn('[CacheManager] Filesystem cache get error:', error);
    }

    return null;
  }

  /**
   * Store data in all appropriate cache layers
   */
  async storeInAllLayers<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const promises: Promise<void>[] = [];

    // Store in filesystem cache
    promises.push(
      this.fsCache.set(key, data, options).catch(error => {
        console.warn('[CacheManager] Filesystem cache store error:', error);
      })
    );

    // Store in browser cache
    promises.push(
      this.browserCache.set(key, data, options).catch((error: any) => {
        console.warn('[CacheManager] Browser cache store error:', error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Get stale data as fallback
   */
  private async getStaleData<T>(key: string): Promise<T | null> {
    // Try filesystem cache even if expired
    try {
      const entry = await (this.fsCache as any).readFromStorage(key);
      if (entry && entry.data) {
        console.log(`[CacheManager] Found stale data for: ${key}`);
        return entry.data;
      }
    } catch (error) {
      console.warn('[CacheManager] Stale data retrieval error:', error);
    }

    return null;
  }

  /**
   * Clear specific key from all cache layers
   */
  async clearKey(key: string): Promise<void> {
    const promises: Promise<void>[] = [];

    promises.push(
      this.fsCache.delete(key).catch(error => {
        console.warn('[CacheManager] Filesystem cache clear error:', error);
      })
    );

    promises.push(
      this.browserCache.delete(key).catch((error: any) => {
        console.warn('[CacheManager] Browser cache clear error:', error);
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    promises.push(
      this.fsCache.clear().catch(error => {
        console.warn('[CacheManager] Filesystem cache clear all error:', error);
      })
    );

    promises.push(
      this.assetCacheInstance.clear().catch(error => {
        console.warn('[CacheManager] Asset cache clear all error:', error);
      })
    );

    promises.push(
      this.browserCache.clear().catch((error: any) => {
        console.warn('[CacheManager] Browser cache clear all error:', error);
      })
    );

    // Reset rate limiting
    rateLimiter.resetAll();

    await Promise.allSettled(promises);
    console.log('[CacheManager] All caches cleared');
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    console.log('[CacheManager] Starting cleanup...');
    
    const promises: Promise<void>[] = [];

    promises.push(
      this.fsCache.cleanup().catch(error => {
        console.warn('[CacheManager] Filesystem cache cleanup error:', error);
      })
    );

    promises.push(
      this.assetCacheInstance.cleanup().catch(error => {
        console.warn('[CacheManager] Asset cache cleanup error:', error);
      })
    );

    await Promise.allSettled(promises);
    console.log('[CacheManager] Cleanup completed');
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<CacheManagerStats> {
    try {
      const [fsStats, assetStats, rateLimitStats] = await Promise.allSettled([
        Promise.resolve(this.fsCache.getStats()),
        Promise.resolve(this.assetCacheInstance.getStats()),
        Promise.resolve(rateLimiter.getStats())
      ]);

      // Get browser cache stats (simplified)
      let browserStats = { size: 0, hitRate: 0 };
      try {
        if (this.browserCache.getStats) {
          browserStats = this.browserCache.getStats();
        }
      } catch (error) {
        console.warn('[CacheManager] Browser cache stats error:', error);
      }

      return {
        filesystem: fsStats.status === 'fulfilled' ? fsStats.value : {
          totalEntries: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          lastCleanup: 0
        },
        assets: assetStats.status === 'fulfilled' ? assetStats.value : {
          totalAssets: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          lastCleanup: 0,
          availableSpace: CACHE_CONFIG.MAX_CACHE_SIZE
        },
        browser: browserStats,
        rateLimiting: rateLimitStats.status === 'fulfilled' ? rateLimitStats.value : {}
      };
    } catch (error) {
      console.error('[CacheManager] Stats collection error:', error);
      throw error;
    }
  }

  /**
   * Check cache health and perform maintenance
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getStats();

      // Check filesystem cache
      if (stats.filesystem.hitRate < 0.5 && stats.filesystem.totalEntries > 10) {
        issues.push('Low filesystem cache hit rate');
        recommendations.push('Consider adjusting TTL settings');
      }

      // Check asset cache
      if (stats.assets.totalSize > CACHE_CONFIG.MAX_CACHE_SIZE * 0.9) {
        issues.push('Asset cache near capacity');
        recommendations.push('Run cleanup or increase cache size limit');
      }

      // Check rate limiting
      const hasCircuitBreakers = Object.values(stats.rateLimiting).some(
        (state: any) => state.circuitBreakerOpen
      );
      if (hasCircuitBreakers) {
        issues.push('Some APIs have circuit breakers open');
        recommendations.push('Check API availability and consider manual reset');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        healthy: false,
        issues: ['Failed to perform health check'],
        recommendations: ['Check cache system configuration']
      };
    }
  }

  /**
   * Preload commonly used assets
   */
  async preloadAssets(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.fetchAsset(url).catch(error => {
        console.warn(`[CacheManager] Failed to preload asset: ${url}`, error);
      })
    );

    await Promise.allSettled(promises);
    console.log(`[CacheManager] Preloaded ${urls.length} assets`);
  }
}

export const cacheManager = new CacheManager();