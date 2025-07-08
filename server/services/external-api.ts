import got from 'got';
import PQueue from 'p-queue';
import { OpenNotifyResponse, LaunchLibraryAstronaut } from '../types/index.js';
import { config } from '../config.js';

// Rate limit external API calls
const queue = new PQueue({ 
  concurrency: 2, 
  interval: 1000, 
  intervalCap: 10 
});

export class ExternalApiService {
  private readonly timeout = 10000; // 10 seconds

  async getAstronautsFromOpenNotify(rateLimitCallback?: (isRateLimit: boolean) => void): Promise<OpenNotifyResponse> {
    return queue.add(async () => {
      console.log('[API] Fetching from Open Notify...');
      
      try {
        const response = await got(config.apis.openNotify, {
          timeout: { request: this.timeout },
          responseType: 'json',
          retry: {
            limit: 2,
            methods: ['GET'],
          },
        }).json<OpenNotifyResponse>();

        console.log(`[API] Open Notify returned ${response.number} astronauts`);
        rateLimitCallback?.(false);
        return response;
      } catch (error) {
        const statusCode = (error as any)?.response?.statusCode;
        const isRateLimit = statusCode === 429;
        
        if (isRateLimit) {
          console.warn('[RATE LIMIT] Open Notify API rate limit hit!');
        }
        rateLimitCallback?.(isRateLimit);
        
        console.error('[API] Open Notify error:', { error, statusCode });
        throw new Error(`Failed to fetch from Open Notify: ${error.message}`);
      }
    });
  }

  async getAstronautDetails(name: string, rateLimitCallback?: (isRateLimit: boolean) => void): Promise<LaunchLibraryAstronaut | null> {
    return queue.add(async () => {
      console.log(`[API] Fetching details for ${name} from Launch Library...`);
      
      try {
        // First try to find astronaut in current space crew with more details
        const inSpaceUrl = `${config.apis.launchLibrary}?search=${encodeURIComponent(name)}&in_space=true&mode=detailed&limit=1`;
        const response = await got(inSpaceUrl, {
          timeout: { request: this.timeout },
          responseType: 'json',
          retry: {
            limit: 2,
            methods: ['GET'],
          },
        }).json<{ results: LaunchLibraryAstronaut[] }>();

        if (response.results && response.results.length > 0) {
          console.log(`[API] Found details for ${name} (in space)`);
          rateLimitCallback?.(false);
          return response.results[0];
        }

        // If not found in space crew, search normally
        const searchUrl = `${config.apis.launchLibrary}?search=${encodeURIComponent(name)}&limit=1`;
        const fallbackResponse = await got(searchUrl, {
          timeout: { request: this.timeout },
          responseType: 'json',
          retry: {
            limit: 2,
            methods: ['GET'],
          },
        }).json<{ results: LaunchLibraryAstronaut[] }>();

        if (fallbackResponse.results && fallbackResponse.results.length > 0) {
          console.log(`[API] Found details for ${name}`);
          rateLimitCallback?.(false);
          return fallbackResponse.results[0];
        }

        console.log(`[API] No details found for ${name}`);
        rateLimitCallback?.(false);
        return null;
      } catch (error) {
        const statusCode = (error as any)?.response?.statusCode;
        const isRateLimit = statusCode === 429;
        
        if (isRateLimit) {
          console.warn(`[RATE LIMIT] Launch Library API rate limit hit for ${name}!`);
        }
        rateLimitCallback?.(isRateLimit);
        
        console.error(`[API] Launch Library error for ${name}:`, { error, statusCode });
        return null; // Don't throw, just return null for graceful degradation
      }
    });
  }

  async getMultipleAstronautDetails(names: string[], rateLimitCallback?: (isRateLimit: boolean) => void): Promise<Map<string, LaunchLibraryAstronaut>> {
    console.log(`[API] Fetching details for ${names.length} astronauts...`);
    
    const results = new Map<string, LaunchLibraryAstronaut>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < names.length; i += batchSize) {
      const batch = names.slice(i, i + batchSize);
      const batchPromises = batch.map(name => 
        this.getAstronautDetails(name, rateLimitCallback).then(details => ({ name, details }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      for (const { name, details } of batchResults) {
        if (details) {
          results.set(name.toLowerCase(), details);
        }
      }
    }
    
    console.log(`[API] Retrieved details for ${results.size}/${names.length} astronauts`);
    return results;
  }

  async getCurrentISSExpedition(): Promise<any> {
    return queue.add(async () => {
      console.log('[API] Fetching current ISS expedition...');
      
      try {
        // Get current ISS expedition
        const expeditionUrl = `https://ll.thespacedevs.com/2.2.0/expedition/?space_station__id=4&end__isnull=true&limit=1`;
        const response = await got(expeditionUrl, {
          timeout: { request: this.timeout },
          responseType: 'json',
          retry: {
            limit: 2,
            methods: ['GET'],
          },
        }).json<{ results: any[] }>();

        if (response.results && response.results.length > 0) {
          console.log('[API] Found current ISS expedition');
          return response.results[0];
        }

        console.log('[API] No current ISS expedition found');
        return null;
      } catch (error) {
        console.error('[API] ISS expedition error:', error);
        return null;
      }
    });
  }
}

export const externalApi = new ExternalApiService();