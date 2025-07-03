interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string;
  allowStale?: boolean; // Whether to return stale data if fresh fetch fails
}

export class BrowserCache {
  private prefix: string;
  private defaultTTL: number;
  private maxSize: number = 5 * 1024 * 1024; // 5MB limit for localStorage

  constructor(prefix: string = 'spaceboard', defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  private isStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  private getStorageSize(): number {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size * 2; // Approximate bytes (UTF-16)
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isStorageAvailable()) {
      console.warn('[Cache] localStorage not available');
      return null;
    }

    const storageKey = this.getStorageKey(key);
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        console.log(`[Cache MISS] ${key}`);
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(stored);
      
      const now = Date.now();
      const age = now - cacheEntry.timestamp;
      const isExpired = age > cacheEntry.ttl;
      
      if (!isExpired) {
        console.log(`[Cache HIT] ${key} (age: ${Math.round(age / 1000)}s)`);
        return cacheEntry.data;
      }
      
      if (options.allowStale) {
        console.log(`[Cache STALE] ${key} (age: ${Math.round(age / 1000)}s) - returning stale data`);
        return cacheEntry.data;
      }
      
      console.log(`[Cache EXPIRED] ${key} (age: ${Math.round(age / 1000)}s)`);
      localStorage.removeItem(storageKey);
      return null;
    } catch (error) {
      console.error(`[Cache ERROR] Failed to read cache for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    if (!this.isStorageAvailable()) {
      console.warn('[Cache] localStorage not available');
      return;
    }

    const storageKey = this.getStorageKey(key);
    const ttl = options.ttl || this.defaultTTL;
    
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };
    
    try {
      const serialized = JSON.stringify(cacheEntry);
      
      // Check if we're approaching storage limit
      const currentSize = this.getStorageSize();
      const newSize = currentSize + serialized.length * 2;
      
      if (newSize > this.maxSize) {
        console.warn(`[Cache] Storage limit approaching (${Math.round(newSize / 1024)}KB). Clearing old entries...`);
        this.clearOldEntries();
      }
      
      localStorage.setItem(storageKey, serialized);
      console.log(`[Cache WRITE] ${key} (TTL: ${Math.round(ttl / 1000)}s, Size: ${Math.round(serialized.length / 1024)}KB)`);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[Cache] Storage quota exceeded, clearing cache...');
        this.clear();
        // Try one more time
        try {
          localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
        } catch (retryError) {
          console.error('[Cache ERROR] Failed to write cache even after clearing:', retryError);
        }
      } else {
        console.error(`[Cache ERROR] Failed to write cache for ${key}:`, error);
      }
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isStorageAvailable()) return;
    
    const storageKey = this.getStorageKey(key);
    localStorage.removeItem(storageKey);
    console.log(`[Cache DELETE] ${key}`);
  }

  async clear(): Promise<void> {
    if (!this.isStorageAvailable()) return;
    
    const keysToRemove: string[] = [];
    for (const key in localStorage) {
      if (key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Cache CLEAR] Removed ${keysToRemove.length} cache entries`);
  }

  private clearOldEntries(): void {
    const entries: Array<{ key: string; entry: CacheEntry; age: number }> = [];
    
    for (const key in localStorage) {
      if (key.startsWith(this.prefix)) {
        try {
          const entry = JSON.parse(localStorage[key]) as CacheEntry;
          const age = Date.now() - entry.timestamp;
          entries.push({ key, entry, age });
        } catch (e) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    }
    
    // Sort by age (oldest first)
    entries.sort((a, b) => b.age - a.age);
    
    // Remove oldest 25%
    const toRemove = Math.ceil(entries.length * 0.25);
    entries.slice(0, toRemove).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
    
    console.log(`[Cache] Cleared ${toRemove} old entries`);
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    entries: Array<{ key: string; size: number; age: number; expired: boolean }>;
  }> {
    if (!this.isStorageAvailable()) {
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }

    const entries: Array<{ key: string; size: number; age: number; expired: boolean }> = [];
    
    for (const key in localStorage) {
      if (key.startsWith(this.prefix)) {
        try {
          const stored = localStorage[key];
          const entry = JSON.parse(stored) as CacheEntry;
          
          const age = Date.now() - entry.timestamp;
          const expired = age > entry.ttl;
          
          entries.push({
            key: entry.key,
            size: stored.length * 2, // UTF-16
            age,
            expired
          });
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    
    return {
      totalEntries: entries.length,
      totalSize,
      entries
    };
  }

  // Helper to fetch data with cache
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }
    
    try {
      // Fetch fresh data
      console.log(`[Cache FETCH] Getting fresh data for ${key}`);
      const freshData = await fetcher();
      
      // Save to cache
      await this.set(key, freshData, options);
      
      return freshData;
    } catch (error) {
      console.error(`[Cache ERROR] Failed to fetch fresh data for ${key}:`, error);
      
      // Try to return stale data if allowed
      if (options.allowStale) {
        const staleData = await this.get<T>(key, { ...options, allowStale: true });
        if (staleData !== null) {
          console.log(`[Cache FALLBACK] Using stale data for ${key} due to fetch error`);
          return staleData;
        }
      }
      
      throw error;
    }
  }
}

// Export singleton instances for common cache types
export const astronautCache = new BrowserCache('spaceboard_astronauts', 24 * 60 * 60 * 1000); // 24 hours
export const apiCache = new BrowserCache('spaceboard_api', 60 * 60 * 1000); // 1 hour