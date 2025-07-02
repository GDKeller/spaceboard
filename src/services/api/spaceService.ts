import { SpaceData, SpacecraftData, ApiError } from '../../types/space.types';
import { launchLibraryService } from './launchLibraryService';

const OPEN_NOTIFY_URL = '/api/astros.json';

class SpaceService {
  private async fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  async getAstronauts(): Promise<SpaceData> {
    try {
      // First fetch from Open Notify to get current astronauts
      const openNotifyResponse = await this.fetchWithTimeout(OPEN_NOTIFY_URL).then(res => res.json());
      
      // Extract astronaut names
      const astronautNames = openNotifyResponse.people.map((p: any) => p.name);
      
      // Then fetch images for those specific astronauts
      const astronautImageMap = await launchLibraryService.getAstronautsWithImages(astronautNames);
      
      // Merge data from both sources
      const mergedAstronauts = openNotifyResponse.people.map((astronaut: any) => {
        // Try to find matching astronaut data from Launch Library
        const launchLibraryData = astronautImageMap.get(astronaut.name.toLowerCase()) || {};
        
        console.log('Merging data for:', astronaut.name);
        console.log('Launch Library data found:', launchLibraryData);
        
        return {
          name: astronaut.name,
          country: launchLibraryData.country || 'Unknown',
          countryFlag: '',
          agency: launchLibraryData.agency || 'Unknown',
          position: launchLibraryData.position || 'Astronaut',
          spaceCraft: astronaut.craft,
          launchDate: new Date().toISOString(),
          totalDaysInSpace: launchLibraryData.totalDaysInSpace || 0,
          expeditionShort: '',
          expeditionLong: '',
          expeditionPatch: '',
          missionPatch: '',
          profileImageLink: launchLibraryData.profileImageLink || '',
          socialMediaPlatforms: {
            instagram: '',
            twitter: '',
            facebook: '',
          },
          iss: astronaut.craft === 'ISS',
          launchVehicle: '',
        };
      });
      
      return {
        numberOfPeople: openNotifyResponse.number,
        expedition: {
          expeditionNumber: 70,
          expeditionStartDate: new Date().toISOString(),
          expeditionEndDate: new Date().toISOString(),
        },
        astronauts: mergedAstronauts,
      };
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Failed to fetch astronaut data',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      };
      throw apiError;
    }
  }

  async getSpacecraft(): Promise<SpacecraftData> {
    // Open Notify API doesn't provide spacecraft data, returning empty for now
    return {
      spacecraftAtISS: 0,
      dockedSpacecraft: [],
    };
  }

  // Cache implementation for better performance
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getCachedAstronauts(): Promise<SpaceData> {
    const cacheKey = 'astronauts';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.getAstronauts();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  async getCachedSpacecraft(): Promise<SpacecraftData> {
    const cacheKey = 'spacecraft';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.getSpacecraft();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const spaceService = new SpaceService();