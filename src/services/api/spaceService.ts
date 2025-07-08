import { SpaceData, SpacecraftData, ApiError } from '../../types/space.types';
import { cacheManager } from '../cache/cacheManager';
import { CACHE_CONFIG } from '../../config/cache.config';
import { API_CONFIG } from '../../config/api.config';

class SpaceService {
  // Validate if astronaut data is complete enough to cache
  private isDataComplete(astronaut: any): boolean {
    // Required fields for complete data
    const hasBasicInfo = astronaut.name && astronaut.craft;
    const hasEnrichedData = astronaut.profileImageLink || astronaut.bio || astronaut.flightsCount !== undefined;
    const hasCountryInfo = astronaut.country !== 'Unknown' && astronaut.countryFlag !== '🌍';
    
    // Consider data complete if it has basic info AND (enriched data OR country info)
    return hasBasicInfo && (hasEnrichedData || hasCountryInfo);
  }
  
  // Calculate completeness percentage for the dataset
  private calculateDataCompleteness(astronauts: any[]): number {
    if (!astronauts || astronauts.length === 0) return 0;
    
    const completeCount = astronauts.filter(a => this.isDataComplete(a)).length;
    return Math.round((completeCount / astronauts.length) * 100);
  }
  
  private generateCountryFlag(country: string): string {
    const countryFlags: { [key: string]: string } = {
      'USA': '🇺🇸',
      'United States': '🇺🇸',
      'Russia': '🇷🇺',
      'Russian Federation': '🇷🇺',
      'Japan': '🇯🇵',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Spain': '🇪🇸',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Denmark': '🇩🇰',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'UAE': '🇦🇪',
      'Saudi Arabia': '🇸🇦'
    };
    return countryFlags[country] || '🌍';
  }

  private generateExpeditionNumber(): number {
    // ISS expeditions are typically 6 months, started in 2000
    // Calculate current expedition based on date
    const startDate = new Date('2000-11-02'); // Expedition 1 start
    const now = new Date();
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return Math.floor(monthsDiff / 6) + 1;
  }

  private generateRealisticLaunchVehicle(craft: string, agency: string): string {
    if (craft === 'ISS') {
      if (agency.includes('NASA') || agency.includes('SpaceX')) return 'Crew Dragon';
      if (agency.includes('Russia') || agency.includes('Roscosmos')) return 'Soyuz MS';
      if (agency.includes('ESA') || agency.includes('Europe')) return 'Crew Dragon';
      if (agency.includes('JAXA') || agency.includes('Japan')) return 'Crew Dragon';
    }
    return 'Soyuz MS'; // Default fallback
  }

  private getRandomTaskStatus(): 'MAINTENANCE' | 'COMMUNICATION' | 'WORKING' | 'REST' {
    const statuses: Array<'MAINTENANCE' | 'COMMUNICATION' | 'WORKING' | 'REST'> = 
      ['MAINTENANCE', 'COMMUNICATION', 'WORKING', 'REST'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private calculateMissionDay(launchDate: number): number {
    const launchMs = launchDate; // Already in milliseconds from server
    const now = Date.now();
    return Math.floor((now - launchMs) / (1000 * 60 * 60 * 24));
  }

  private determineRole(country: string, agency: string): string {
    if (country === 'China') return 'Taikonaut';
    if (agency?.includes('ESA')) return 'ESA Astronaut';
    if (agency?.includes('JAXA')) return 'JAXA Astronaut';
    if (agency?.includes('ROSCOSMOS') || country === 'Russia') return 'Cosmonaut';
    return 'Astronaut';
  }

  private generateVitals(): { o2Sat: number; bpm: number; temp: number } {
    return {
      o2Sat: 97 + Math.floor(Math.random() * 3), // 97-99%
      bpm: 65 + Math.floor(Math.random() * 15), // 65-80 bpm
      temp: 36.5 + Math.round(Math.random() * 0.8 * 10) / 10 // 36.5-37.3°C
    };
  }

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

  async getAstronauts(forceRefresh: boolean = false): Promise<SpaceData> {
    const cacheKey = CACHE_CONFIG.CACHE_KEYS.ASTRONAUT_DATA;
    
    // Define the fetcher function that will be called if cache miss
    const fetcher = async (): Promise<SpaceData> => {
      const astronautUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASTRONAUTS}`;
      console.log('[API] Fetching from server:', astronautUrl);
      
      // Fetch from our server instead of external APIs
      const response = await this.fetchWithTimeout(astronautUrl);
      const data = await response.json();
      
      // Transform server response to match our SpaceData type
      const astronauts = data.astronauts.map((astronaut: any) => {
        // Transform image URLs to use our proxy
        const profileImageLink = astronaut.profileImageLink 
          ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGE_PROXY}?url=${encodeURIComponent(astronaut.profileImageLink)}`
          : '';
        const profileImageThumbnail = astronaut.profileImageThumbnail
          ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGE_PROXY}?url=${encodeURIComponent(astronaut.profileImageThumbnail)}`
          : '';
        
        return {
          ...astronaut,
          spaceCraft: astronaut.craft || astronaut.spaceCraft || 'Unknown', // Map craft to spaceCraft
          profileImageLink,
          profileImageThumbnail,
          // Ensure all required fields are present
          currentActivity: astronaut.currentActivity || 'working',
          healthStatus: astronaut.healthStatus || 'nominal',
          socialMediaPlatforms: astronaut.socialMediaPlatforms || {
            instagram: '',
            twitter: '',
            facebook: '',
          },
          currentMission: astronaut.currentMission || {
            name: `${astronaut.craft} Operations`,
            description: `Operations aboard ${astronaut.craft}`,
            startDate: astronaut.launchDate,
            expectedDuration: 180,
            status: 'active'
          },
          // Ensure other required fields have defaults
          countryFlag: astronaut.countryFlag || this.generateCountryFlag(astronaut.country),
          expeditionShort: astronaut.expeditionShort || '',
          expeditionLong: astronaut.expeditionLong || '',
          expeditionPatch: astronaut.expeditionPatch || '',
          missionPatch: astronaut.missionPatch || '',
          iss: astronaut.craft === 'ISS',
          launchVehicle: astronaut.launchVehicle || '',
          // Add tactical display fields
          taskStatus: this.getRandomTaskStatus(),
          missionDay: this.calculateMissionDay(astronaut.launchDate),
          role: this.determineRole(astronaut.country, astronaut.agency),
          vitals: this.generateVitals()
        };
      });
      
      return {
        numberOfPeople: data.numberOfPeople,
        expedition: {
          expeditionNumber: this.generateExpeditionNumber().toString(),
          expeditionStartDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
          expeditionEndDate: Date.now() + (120 * 24 * 60 * 60 * 1000), // 120 days from now
        },
        astronauts,
      };
    };
    
    try {
      // Use the new cache manager for client-side caching too
      const data = await cacheManager.fetchWithCache(
        cacheKey,
        fetcher,
        {
          ttl: CACHE_CONFIG.ASTRONAUT_DATA_TTL,
          forceRefresh,
          retries: 3,
          timeout: 30000, // 30 seconds
          onRetry: (attempt, retryAfter) => {
            console.log(`[SpaceService] Retry attempt ${attempt}, waiting ${retryAfter}ms`);
          }
        }
      );
      
      return data;
    } catch (error) {
      console.error('[API] Error fetching astronauts:', error);
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
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter for development)

  async getCachedAstronauts(forceRefresh: boolean = false): Promise<SpaceData> {
    return this.getAstronauts(forceRefresh);
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

  async clearCache(): Promise<void> {
    this.cache.clear();
    // Clear all cache layers using cache manager
    try {
      await cacheManager.clearAll();
      console.log('[Cache] All cache layers cleared');
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }
}

export const spaceService = new SpaceService();