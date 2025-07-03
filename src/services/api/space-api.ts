import { OpenNotifyClient } from './open-notify';
import { SpaceDevsClient } from './spacedevs';
import { ApiResponse, Astronaut, Launch, OrbitalPosition } from '../../types';

export class SpaceApiService {
  private openNotify: OpenNotifyClient;
  private spaceDevs: SpaceDevsClient;
  private astronautCache: Map<string, Astronaut> = new Map();

  constructor(spaceDevsApiKey?: string) {
    this.openNotify = new OpenNotifyClient();
    this.spaceDevs = new SpaceDevsClient(spaceDevsApiKey);
  }

  /**
   * Get all astronauts currently in space with enriched data
   */
  async getAstronautsInSpace(): Promise<ApiResponse<Astronaut[]>> {
    try {
      // First get basic astronaut data from Open Notify
      const basicResponse = await this.openNotify.getAstronautsInSpace();
      
      if (basicResponse.error) {
        return basicResponse;
      }

      // Then enrich with SpaceDevs data (photos, bio, etc)
      const enrichedAstronauts = await Promise.all(
        basicResponse.data.map(async (astronaut) => {
          // Check cache first
          const cached = this.astronautCache.get(astronaut.name);
          if (cached && cached.image_url) {
            return cached;
          }

          // Try to get additional data from SpaceDevs
          const detailedResponse = await this.spaceDevs.searchAstronautByName(astronaut.name);
          
          if (detailedResponse.data) {
            // Merge the data
            const enriched: Astronaut = {
              ...astronaut,
              image_url: detailedResponse.data.image_url,
              bio: detailedResponse.data.bio,
              nationality: detailedResponse.data.nationality,
              eva_hours: detailedResponse.data.eva_hours,
              missions_count: detailedResponse.data.missions_count,
              agency: detailedResponse.data.agency
            };
            
            // Cache the enriched data
            this.astronautCache.set(astronaut.name, enriched);
            return enriched;
          }
          
          return astronaut;
        })
      );

      return {
        data: enrichedAstronauts,
        timestamp: new Date().toISOString(),
        cached: false
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current ISS position
   */
  async getISSPosition(): Promise<ApiResponse<OrbitalPosition>> {
    return this.openNotify.getISSPosition();
  }

  /**
   * Get upcoming launches
   */
  async getUpcomingLaunches(limit?: number): Promise<ApiResponse<Launch[]>> {
    return this.spaceDevs.getUpcomingLaunches(limit);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.openNotify.clearCache();
    this.spaceDevs.clearCache();
    this.astronautCache.clear();
  }
}