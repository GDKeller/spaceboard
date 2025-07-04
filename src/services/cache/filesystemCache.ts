import { CACHE_CONFIG } from '../../config/cache.config';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hash: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

export class FilesystemCache {
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    lastCleanup: 0,
  };
  
  private hits = 0;
  private misses = 0;

  constructor(private cacheDir: string = CACHE_CONFIG.API_CACHE_DIR) {
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (typeof window !== 'undefined') {
      // Browser environment - we can't create directories
      // Use IndexedDB or localStorage as fallback
      console.warn('[FilesystemCache] Browser environment detected, using localStorage fallback');
      return;
    }
    
    // Node.js environment (for SSR or testing)
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn('[FilesystemCache] Could not create cache directory:', error);
    }
  }

  private generateHash(data: any): string {
    // Simple hash function for data comparison
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private getFilePath(key: string): string {
    return `${this.cacheDir}/${key}.json`;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > entry.ttl;
  }

  private async readFromStorage(key: string): Promise<CacheEntry | null> {
    if (typeof window !== 'undefined') {
      // Browser environment - use localStorage
      try {
        const stored = localStorage.getItem(`fs_cache_${key}`);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('[FilesystemCache] localStorage read error:', error);
        return null;
      }
    } else {
      // Node.js environment
      try {
        const fs = require('fs');
        const filePath = this.getFilePath(key);
        
        if (!fs.existsSync(filePath)) {
          return null;
        }
        
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.error('[FilesystemCache] File read error:', error);
        return null;
      }
    }
  }

  private async writeToStorage(key: string, entry: CacheEntry): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment - use localStorage
      try {
        localStorage.setItem(`fs_cache_${key}`, JSON.stringify(entry));
      } catch (error) {
        console.error('[FilesystemCache] localStorage write error:', error);
        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
          await this.cleanup();
          // Retry once after cleanup
          try {
            localStorage.setItem(`fs_cache_${key}`, JSON.stringify(entry));
          } catch (retryError) {
            console.error('[FilesystemCache] localStorage retry write failed:', retryError);
          }
        }
      }
    } else {
      // Node.js environment
      try {
        const fs = require('fs');
        const filePath = this.getFilePath(key);
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
      } catch (error) {
        console.error('[FilesystemCache] File write error:', error);
      }
    }
  }

  private async deleteFromStorage(key: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment
      try {
        localStorage.removeItem(`fs_cache_${key}`);
      } catch (error) {
        console.error('[FilesystemCache] localStorage delete error:', error);
      }
    } else {
      // Node.js environment
      try {
        const fs = require('fs');
        const filePath = this.getFilePath(key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('[FilesystemCache] File delete error:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.readFromStorage(key);
      
      if (!entry) {
        this.misses++;
        return null;
      }
      
      if (this.isExpired(entry)) {
        await this.deleteFromStorage(key);
        this.misses++;
        return null;
      }
      
      this.hits++;
      this.updateStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[FilesystemCache] Cache hit for key: ${key}`);
      }
      
      return entry.data;
    } catch (error) {
      console.error('[FilesystemCache] Get error:', error);
      this.misses++;
      return null;
    }
  }

  async set<T>(key: string, data: T, options: { ttl?: number; metadata?: Record<string, any> } = {}): Promise<void> {
    try {
      const ttl = options.ttl || CACHE_CONFIG.DEFAULT_TTL;
      const hash = this.generateHash(data);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        hash,
        metadata: options.metadata,
      };
      
      await this.writeToStorage(key, entry);
      this.updateStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[FilesystemCache] Cached data for key: ${key}, TTL: ${ttl}ms`);
      }
    } catch (error) {
      console.error('[FilesystemCache] Set error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const entry = await this.readFromStorage(key);
      return entry !== null && !this.isExpired(entry);
    } catch (error) {
      console.error('[FilesystemCache] Has error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.deleteFromStorage(key);
      this.updateStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[FilesystemCache] Deleted cache entry: ${key}`);
      }
    } catch (error) {
      console.error('[FilesystemCache] Delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - clear localStorage items with our prefix
        const keys = Object.keys(localStorage).filter(key => key.startsWith('fs_cache_'));
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        // Node.js environment - remove all cache files
        const fs = require('fs');
        if (fs.existsSync(this.cacheDir)) {
          const files = fs.readdirSync(this.cacheDir);
          files.forEach((file: string) => {
            if (file.endsWith('.json')) {
              fs.unlinkSync(`${this.cacheDir}/${file}`);
            }
          });
        }
      }
      
      this.resetStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log('[FilesystemCache] Cache cleared');
      }
    } catch (error) {
      console.error('[FilesystemCache] Clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - clean up expired localStorage items
        const keys = Object.keys(localStorage).filter(key => key.startsWith('fs_cache_'));
        for (const key of keys) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry = JSON.parse(stored);
              if (this.isExpired(entry)) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      } else {
        // Node.js environment - clean up expired files
        const fs = require('fs');
        if (fs.existsSync(this.cacheDir)) {
          const files = fs.readdirSync(this.cacheDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const filePath = `${this.cacheDir}/${file}`;
                const content = fs.readFileSync(filePath, 'utf-8');
                const entry = JSON.parse(content);
                if (this.isExpired(entry)) {
                  fs.unlinkSync(filePath);
                }
              } catch (error) {
                // Remove corrupted files
                fs.unlinkSync(`${this.cacheDir}/${file}`);
              }
            }
          }
        }
      }
      
      this.stats.lastCleanup = Date.now();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log('[FilesystemCache] Cache cleanup completed');
      }
    } catch (error) {
      console.error('[FilesystemCache] Cleanup error:', error);
    }
  }

  async compareAndUpdate<T>(key: string, newData: T, options: { ttl?: number; metadata?: Record<string, any> } = {}): Promise<boolean> {
    try {
      const existingEntry = await this.readFromStorage(key);
      const newHash = this.generateHash(newData);
      
      if (!existingEntry || existingEntry.hash !== newHash || this.isExpired(existingEntry)) {
        await this.set(key, newData, options);
        return true; // Data was updated
      }
      
      return false; // Data unchanged
    } catch (error) {
      console.error('[FilesystemCache] Compare and update error:', error);
      return false;
    }
  }

  private updateStats(): void {
    this.stats.hitRate = this.hits / (this.hits + this.misses);
    this.stats.missRate = this.misses / (this.hits + this.misses);
  }

  private resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: Date.now(),
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}

export const filesystemCache = new FilesystemCache();