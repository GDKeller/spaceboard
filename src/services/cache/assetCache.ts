import { CACHE_CONFIG } from '../../config/cache.config';

export interface AssetEntry {
  url: string;
  localPath: string;
  filename: string;
  size: number;
  mimeType: string;
  timestamp: number;
  lastAccessed: number;
  ttl: number;
  hash: string;
  metadata?: Record<string, any>;
}

export interface AssetCacheStats {
  totalAssets: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
  availableSpace: number;
}

export class AssetCache {
  private stats: AssetCacheStats = {
    totalAssets: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    lastCleanup: 0,
    availableSpace: CACHE_CONFIG.MAX_CACHE_SIZE,
  };
  
  private hits = 0;
  private misses = 0;
  private assetsIndex = new Map<string, AssetEntry>();
  private cachedUrlMap = new Map<string, string>(); // Maps original URLs to stable cached URLs

  constructor(private cacheDir: string = CACHE_CONFIG.ASSETS_CACHE_DIR) {
    this.ensureCacheDir();
    this.loadAssetsIndex();
  }

  private ensureCacheDir(): void {
    if (typeof window !== 'undefined') {
      console.warn('[AssetCache] Browser environment detected, using blob URLs');
      return;
    }
    
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn('[AssetCache] Could not create cache directory:', error);
    }
  }

  private async loadAssetsIndex(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - load from localStorage
        const stored = localStorage.getItem('asset_cache_index');
        if (stored) {
          const entries = JSON.parse(stored);
          this.assetsIndex = new Map(entries);
        }
      } else {
        // Node.js environment - load from file
        const fs = require('fs');
        const indexPath = `${this.cacheDir}/index.json`;
        
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf-8');
          const entries = JSON.parse(content);
          this.assetsIndex = new Map(entries);
        }
      }
      
      this.updateStats();
    } catch (error) {
      console.error('[AssetCache] Failed to load assets index:', error);
    }
  }

  private async saveAssetsIndex(): Promise<void> {
    try {
      const entries = Array.from(this.assetsIndex.entries());
      
      if (typeof window !== 'undefined') {
        // Browser environment - save to localStorage
        localStorage.setItem('asset_cache_index', JSON.stringify(entries));
      } else {
        // Node.js environment - save to file
        const fs = require('fs');
        const indexPath = `${this.cacheDir}/index.json`;
        fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2));
      }
    } catch (error) {
      console.error('[AssetCache] Failed to save assets index:', error);
    }
  }

  private generateAssetKey(url: string): string {
    // Generate a unique key for the asset based on URL
    const hash = this.generateHash(url);
    const extension = this.getFileExtension(url);
    return `${hash}.${extension}`;
  }

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private getFileExtension(url: string): string {
    const match = url.match(/\.([^.?#]+)(\?|#|$)/);
    return match ? match[1].toLowerCase() : 'bin';
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      bmp: 'image/bmp',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async downloadAsset(url: string): Promise<{ data: ArrayBuffer; mimeType: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SpaceBoard/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > CACHE_CONFIG.MAX_ASSET_SIZE) {
        throw new Error(`Asset too large: ${contentLength} bytes`);
      }
      
      const data = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || this.getMimeType(this.getFileExtension(url));
      
      return { data, mimeType };
    } catch (error) {
      console.error('[AssetCache] Download failed:', error);
      throw error;
    }
  }

  private async storeAsset(filename: string, data: ArrayBuffer, mimeType: string): Promise<string> {
    if (typeof window !== 'undefined') {
      // Browser environment - store raw data in localStorage and create blob URL on demand
      try {
        // Convert ArrayBuffer to base64 for localStorage storage
        const uint8Array = new Uint8Array(data);
        const base64 = btoa(String.fromCharCode(...uint8Array));
        
        // Store the base64 data and metadata
        const assetData = {
          data: base64,
          mimeType,
          timestamp: Date.now()
        };
        
        localStorage.setItem(`asset_data_${filename}`, JSON.stringify(assetData));
        
        // Create blob URL for immediate use
        const blob = new Blob([data], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        // Store the current blob URL (but don't rely on it persisting)
        const blobStore = JSON.parse(localStorage.getItem('asset_blob_store') || '{}');
        blobStore[filename] = blobUrl;
        localStorage.setItem('asset_blob_store', JSON.stringify(blobStore));
        
        return blobUrl;
      } catch (error) {
        console.warn('[AssetCache] Failed to store asset data:', error);
        // Fallback to simple blob URL (will not persist across reloads)
        const blob = new Blob([data], { type: mimeType });
        return URL.createObjectURL(blob);
      }
    } else {
      // Node.js environment - save to file
      const fs = require('fs');
      const filePath = `${this.cacheDir}/${filename}`;
      const buffer = Buffer.from(data);
      fs.writeFileSync(filePath, buffer);
      return filePath;
    }
  }

  private async readAsset(filename: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - check for existing valid blob URL first
        const blobStore = JSON.parse(localStorage.getItem('asset_blob_store') || '{}');
        const existingBlobUrl = blobStore[filename];
        
        // Check if we have a valid existing blob URL
        if (existingBlobUrl) {
          // Verify the blob URL is still valid by checking if we can fetch it
          try {
            const response = await fetch(existingBlobUrl, { method: 'HEAD' });
            if (response.ok) {
              if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
                console.log(`[AssetCache] Reusing existing blob URL for ${filename}`);
              }
              return existingBlobUrl;
            }
          } catch (e) {
            // Blob URL is invalid, we'll recreate it
            if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
              console.log(`[AssetCache] Existing blob URL invalid for ${filename}, recreating...`);
            }
          }
        }
        
        // Try to recreate from stored base64 data
        try {
          const storedAsset = localStorage.getItem(`asset_data_${filename}`);
          if (storedAsset) {
            const assetData = JSON.parse(storedAsset);
            
            // Convert base64 back to ArrayBuffer
            const binaryString = atob(assetData.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Create fresh blob URL
            const blob = new Blob([bytes], { type: assetData.mimeType });
            const blobUrl = URL.createObjectURL(blob);
            
            // Revoke old blob URL if it exists and is different
            if (existingBlobUrl && existingBlobUrl !== blobUrl) {
              try {
                URL.revokeObjectURL(existingBlobUrl);
              } catch (e) {
                // Ignore revoke errors
              }
            }
            
            // Update blob store with new URL
            blobStore[filename] = blobUrl;
            localStorage.setItem('asset_blob_store', JSON.stringify(blobStore));
            
            if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
              console.log(`[AssetCache] Created new blob URL for ${filename}`);
            }
            return blobUrl;
          }
        } catch (error) {
          console.warn('[AssetCache] Failed to recreate blob URL:', error);
        }
        
        return null;
      } else {
        // Node.js environment - return file path
        const fs = require('fs');
        const filePath = `${this.cacheDir}/${filename}`;
        return fs.existsSync(filePath) ? filePath : null;
      }
    } catch (error) {
      console.error('[AssetCache] Read asset error:', error);
      return null;
    }
  }

  private async deleteAsset(filename: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - revoke blob URL and delete stored data
        const blobStore = JSON.parse(localStorage.getItem('asset_blob_store') || '{}');
        if (blobStore[filename]) {
          URL.revokeObjectURL(blobStore[filename]);
          delete blobStore[filename];
          localStorage.setItem('asset_blob_store', JSON.stringify(blobStore));
        }
        
        // Also delete the stored base64 data
        localStorage.removeItem(`asset_data_${filename}`);
      } else {
        // Node.js environment - delete file
        const fs = require('fs');
        const filePath = `${this.cacheDir}/${filename}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('[AssetCache] Delete asset error:', error);
    }
  }

  private isExpired(entry: AssetEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > entry.ttl;
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    if (this.stats.totalSize + requiredSize <= CACHE_CONFIG.MAX_CACHE_SIZE) {
      return;
    }
    
    // Sort by last accessed time (LRU)
    const entries = Array.from(this.assetsIndex.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    for (const [key, entry] of entries) {
      await this.deleteAsset(entry.filename);
      this.assetsIndex.delete(key);
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSize) {
        break;
      }
    }
    
    await this.saveAssetsIndex();
    this.updateStats();
  }

  async get(url: string): Promise<string | null> {
    try {
      const key = this.generateAssetKey(url);
      const entry = this.assetsIndex.get(key);
      
      if (!entry) {
        this.misses++;
        return null;
      }
      
      if (this.isExpired(entry)) {
        await this.delete(url);
        this.misses++;
        return null;
      }
      
      const localPath = await this.readAsset(entry.filename);
      if (!localPath) {
        // Asset file missing, remove from index
        this.assetsIndex.delete(key);
        await this.saveAssetsIndex();
        this.misses++;
        return null;
      }
      
      // Update last accessed time
      entry.lastAccessed = Date.now();
      this.assetsIndex.set(key, entry);
      await this.saveAssetsIndex();
      
      this.hits++;
      this.updateStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[AssetCache] Cache hit for: ${url}`);
      }
      
      return localPath;
    } catch (error) {
      console.error('[AssetCache] Get error:', error);
      this.misses++;
      return null;
    }
  }

  async set(url: string, options: { ttl?: number; metadata?: Record<string, any> } = {}): Promise<string | null> {
    try {
      const key = this.generateAssetKey(url);
      const filename = key;
      const ttl = options.ttl || CACHE_CONFIG.ASSET_TTL;
      
      // Check if already cached and not expired
      const existing = this.assetsIndex.get(key);
      if (existing && !this.isExpired(existing)) {
        const localPath = await this.readAsset(existing.filename);
        if (localPath) {
          return localPath;
        }
      }
      
      // Download the asset
      const { data, mimeType } = await this.downloadAsset(url);
      const size = data.byteLength;
      
      // Ensure we have enough space
      await this.ensureSpace(size);
      
      // Store the asset
      const localPath = await this.storeAsset(filename, data, mimeType);
      
      // Create cache entry
      const entry: AssetEntry = {
        url,
        localPath,
        filename,
        size,
        mimeType,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        ttl,
        hash: this.generateHash(url),
        metadata: options.metadata,
      };
      
      this.assetsIndex.set(key, entry);
      await this.saveAssetsIndex();
      this.updateStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[AssetCache] Cached asset: ${url} -> ${localPath}`);
      }
      
      return localPath;
    } catch (error) {
      console.error('[AssetCache] Set error:', error);
      return null;
    }
  }

  async has(url: string): Promise<boolean> {
    try {
      const key = this.generateAssetKey(url);
      const entry = this.assetsIndex.get(key);
      
      if (!entry || this.isExpired(entry)) {
        return false;
      }
      
      const localPath = await this.readAsset(entry.filename);
      return localPath !== null;
    } catch (error) {
      console.error('[AssetCache] Has error:', error);
      return false;
    }
  }

  async delete(url: string): Promise<void> {
    try {
      const key = this.generateAssetKey(url);
      const entry = this.assetsIndex.get(key);
      
      if (entry) {
        await this.deleteAsset(entry.filename);
        this.assetsIndex.delete(key);
        await this.saveAssetsIndex();
        this.updateStats();
        
        if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
          console.log(`[AssetCache] Deleted asset: ${url}`);
        }
      }
    } catch (error) {
      console.error('[AssetCache] Delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Delete all assets
      for (const [, entry] of this.assetsIndex) {
        await this.deleteAsset(entry.filename);
      }
      
      // Clear all asset data in localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith('asset_data_')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.removeItem('asset_blob_store');
      }
      
      this.assetsIndex.clear();
      this.cachedUrlMap.clear(); // Clear the stable URL map
      await this.saveAssetsIndex();
      this.resetStats();
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log('[AssetCache] Cache cleared');
      }
    } catch (error) {
      console.error('[AssetCache] Clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const toDelete: string[] = [];
      
      for (const [key, entry] of this.assetsIndex) {
        if (this.isExpired(entry)) {
          toDelete.push(key);
        }
      }
      
      for (const key of toDelete) {
        const entry = this.assetsIndex.get(key);
        if (entry) {
          await this.deleteAsset(entry.filename);
          this.assetsIndex.delete(key);
        }
      }
      
      await this.saveAssetsIndex();
      this.updateStats();
      this.stats.lastCleanup = now;
      
      if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
        console.log(`[AssetCache] Cleanup completed, removed ${toDelete.length} expired assets`);
      }
    } catch (error) {
      console.error('[AssetCache] Cleanup error:', error);
    }
  }

  private updateStats(): void {
    this.stats.totalAssets = this.assetsIndex.size;
    this.stats.totalSize = Array.from(this.assetsIndex.values()).reduce((sum, entry) => sum + entry.size, 0);
    this.stats.hitRate = this.hits / (this.hits + this.misses) || 0;
    this.stats.missRate = this.misses / (this.hits + this.misses) || 0;
    this.stats.availableSpace = CACHE_CONFIG.MAX_CACHE_SIZE - this.stats.totalSize;
  }

  private resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.stats = {
      totalAssets: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: Date.now(),
      availableSpace: CACHE_CONFIG.MAX_CACHE_SIZE,
    };
  }

  getStats(): AssetCacheStats {
    return { ...this.stats };
  }

  async getCachedAssetUrl(url: string): Promise<string> {
    // If the URL is already a blob URL, we can't download it - return as is
    if (url.startsWith('blob:')) {
      console.warn('[AssetCache] Cannot cache blob URL, returning original:', url);
      return url;
    }
    
    // If it's not a valid HTTP/HTTPS URL, return as is
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url;
    }
    
    // Check if we already have a stable cached URL for this resource
    const existingCachedUrl = this.cachedUrlMap.get(url);
    if (existingCachedUrl) {
      // Verify it's still valid
      try {
        const response = await fetch(existingCachedUrl, { method: 'HEAD' });
        if (response.ok) {
          if (CACHE_CONFIG.ENABLE_CACHE_LOGGING) {
            console.log(`[AssetCache] Returning stable cached URL for: ${url}`);
          }
          return existingCachedUrl;
        }
      } catch (e) {
        // Cached URL is invalid, clear it
        this.cachedUrlMap.delete(url);
      }
    }
    
    const cachedPath = await this.get(url);
    if (cachedPath) {
      // Store in our stable URL map
      this.cachedUrlMap.set(url, cachedPath);
      return cachedPath;
    }
    
    // Try to cache it
    const newPath = await this.set(url);
    if (newPath) {
      // Store in our stable URL map
      this.cachedUrlMap.set(url, newPath);
      return newPath;
    }
    
    return url; // Fallback to original URL
  }
}

export const assetCache = new AssetCache();