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

  async getAstronautsFromOpenNotify(): Promise<OpenNotifyResponse> {
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
        return response;
      } catch (error) {
        console.error('[API] Open Notify error:', error);
        throw new Error(`Failed to fetch from Open Notify: ${error.message}`);
      }
    });
  }

  async getAstronautDetails(name: string): Promise<LaunchLibraryAstronaut | null> {
    return queue.add(async () => {
      console.log(`[API] Fetching details for ${name} from Launch Library...`);
      
      try {
        const searchUrl = `${config.apis.launchLibrary}?search=${encodeURIComponent(name)}&limit=1`;
        const response = await got(searchUrl, {
          timeout: { request: this.timeout },
          responseType: 'json',
          retry: {
            limit: 2,
            methods: ['GET'],
          },
        }).json<{ results: LaunchLibraryAstronaut[] }>();

        if (response.results && response.results.length > 0) {
          console.log(`[API] Found details for ${name}`);
          return response.results[0];
        }

        console.log(`[API] No details found for ${name}`);
        return null;
      } catch (error) {
        console.error(`[API] Launch Library error for ${name}:`, error);
        return null; // Don't throw, just return null for graceful degradation
      }
    });
  }

  async getMultipleAstronautDetails(names: string[]): Promise<Map<string, LaunchLibraryAstronaut>> {
    console.log(`[API] Fetching details for ${names.length} astronauts...`);
    
    const results = new Map<string, LaunchLibraryAstronaut>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < names.length; i += batchSize) {
      const batch = names.slice(i, i + batchSize);
      const batchPromises = batch.map(name => 
        this.getAstronautDetails(name).then(details => ({ name, details }))
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
}

export const externalApi = new ExternalApiService();