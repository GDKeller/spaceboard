import { ApiResponse, DataSource } from '../../types';

export abstract class BaseApiClient {
  protected baseUrl: string;
  protected apiKey?: string;
  protected rateLimitMs: number;
  protected lastRequest: number = 0;
  protected cache: Map<string, { data: any; timestamp: number }> = new Map();
  protected cacheTimeout: number = 5 * 60 * 1000; // 5 minutes default

  constructor(config: DataSource) {
    this.baseUrl = config.url;
    this.apiKey = config.api_key;
    this.rateLimitMs = config.rate_limit || 1000;
  }

  protected async fetchWithRateLimit<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // Check cache first
    const cacheKey = `${endpoint}${JSON.stringify(options?.body || {})}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return {
        data: cached.data,
        timestamp: new Date(cached.timestamp).toISOString(),
        cached: true
      };
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.rateLimitMs) {
      await this.delay(this.rateLimitMs - timeSinceLastRequest);
    }

    try {
      this.lastRequest = Date.now();
      
      const headers = new Headers(options?.headers);
      if (this.apiKey) {
        headers.set('Authorization', `Bearer ${this.apiKey}`);
      }
      headers.set('Content-Type', 'application/json');

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return {
        data,
        timestamp: new Date().toISOString(),
        cached: false
      };
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearCache(): void {
    this.cache.clear();
  }

  setCacheTimeout(ms: number): void {
    this.cacheTimeout = ms;
  }
}