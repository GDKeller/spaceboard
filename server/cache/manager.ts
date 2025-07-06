import NodeCache from 'node-cache';
import { CacheConfig } from '../types/index.js';

export class CacheManager {
  private cache: NodeCache;
  private hits = 0;
  private misses = 0;

  constructor(config: CacheConfig) {
    this.cache = new NodeCache({
      stdTTL: config.ttl / 1000, // Convert ms to seconds
      checkperiod: config.checkperiod || 600,
      useClones: false, // Better performance
      maxKeys: config.maxKeys || -1,
    });

    // Log cache events in development
    if (process.env.NODE_ENV === 'development') {
      this.cache.on('set', (key) => {
        console.log(`[Cache] Set: ${key}`);
      });
      this.cache.on('expired', (key) => {
        console.log(`[Cache] Expired: ${key}`);
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        this.hits++;
        return value;
      }
      this.misses++;
      return null;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      return this.cache.set(key, value, ttl ? ttl / 1000 : undefined);
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.del(key) > 0;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    this.cache.flushAll();
    this.resetStats();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getStats() {
    const keys = this.cache.keys();
    const stats = this.cache.getStats();
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      keys: keys.length,
      ...stats,
    };
  }

  private resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  // Get remaining TTL for a key
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  // Refresh TTL without changing value
  touch(key: string, ttl?: number): boolean {
    if (!this.has(key)) return false;
    const value = this.cache.get(key);
    if (value !== undefined) {
      return this.cache.set(key, value, ttl ? ttl / 1000 : undefined);
    }
    return false;
  }
}

// Create singleton instances
export const astronautCache = new CacheManager({
  ttl: parseInt(process.env.CACHE_TTL_ASTRONAUTS || '21600000', 10),
  checkperiod: 600,
});

export const imageCache = new CacheManager({
  ttl: parseInt(process.env.CACHE_TTL_IMAGES || '86400000', 10),
  checkperiod: 600,
});