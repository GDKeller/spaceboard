import { SpaceData, SpacecraftData, ApiError } from '../../types/space.types';
import { launchLibraryService } from './launchLibraryService';
import { cacheManager } from '../cache/cacheManager';
import { CACHE_CONFIG } from '../../config/cache.config';

const OPEN_NOTIFY_URL = '/api/astros.json';

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
    
    // Check if we need to force refresh due to stale blob URLs in cached data
    if (!forceRefresh) {
      try {
        const cachedData = await cacheManager.get<SpaceData>(cacheKey);
        if (cachedData && cachedData.astronauts) {
          // Check if any astronaut has a blob URL (indicates stale cache)
          const hasStaleUrls = cachedData.astronauts.some(astronaut => 
            astronaut.profileImageLink && astronaut.profileImageLink.startsWith('blob:')
          );
          if (hasStaleUrls) {
            console.log('[SpaceService] Detected stale blob URLs in cache, forcing refresh');
            forceRefresh = true;
          }
        }
      } catch (error) {
        console.warn('[SpaceService] Error checking cached data:', error);
      }
    }
    
    // Define the fetcher function that will be called if cache miss
    const fetcher = async (): Promise<SpaceData> => {
      console.log('[API] Fetching from Open Notify:', OPEN_NOTIFY_URL);
      
      // First fetch from Open Notify to get current astronauts
      const openNotifyResponse = await this.fetchWithTimeout(OPEN_NOTIFY_URL).then(res => res.json());
      
      // Extract astronaut names
      const astronautNames = openNotifyResponse.people.map((p: any) => p.name);
      
      // Then fetch images for those specific astronauts
      const astronautImageMap = await launchLibraryService.getAstronautsWithImages(astronautNames);
      
      // Merge data from both sources with enhanced mapping and asset caching
      const mergedAstronauts = await Promise.all(
        openNotifyResponse.people.map(async (astronaut: any) => {
          // Try to find matching astronaut data from Launch Library
          const launchLibraryData = astronautImageMap.get(astronaut.name.toLowerCase()) || {};
          
          console.log('Merging data for:', astronaut.name);
          console.log('Launch Library data found:', launchLibraryData);
          
          // Store original URLs - these will be processed through asset cache when needed
          const profileImageLink = launchLibraryData.profileImageLink || '';
          const profileImageThumbnail = launchLibraryData.profileImageThumbnail || '';
          
          // Preload images into cache but don't store blob URLs in data
          if (profileImageLink) {
            try {
              await cacheManager.fetchAsset(profileImageLink, {
                ttl: CACHE_CONFIG.ASSET_TTL,
                metadata: { astronautName: astronaut.name, type: 'profile' }
              });
            } catch (error) {
              console.warn(`Failed to preload profile image for ${astronaut.name}:`, error);
            }
          }
          
          if (profileImageThumbnail) {
            try {
              await cacheManager.fetchAsset(profileImageThumbnail, {
                ttl: CACHE_CONFIG.ASSET_TTL,
                metadata: { astronautName: astronaut.name, type: 'thumbnail' }
              });
            } catch (error) {
              console.warn(`Failed to preload thumbnail for ${astronaut.name}:`, error);
            }
          }
          
          // Generate realistic activity based on current time
          const activities = ['working', 'research', 'exercise', 'meal', 'communication', 'maintenance'];
          const hour = new Date().getHours();
          let currentActivity = 'working';
          
          if (hour >= 22 || hour <= 6) currentActivity = 'sleeping';
          else if (hour >= 12 && hour <= 13) currentActivity = 'meal';
          else if (hour >= 17 && hour <= 18) currentActivity = 'exercise';
          else currentActivity = activities[Math.floor(Math.random() * activities.length)];
          
          // Generate mission data based on current expedition
          const missionStartDate = new Date();
          missionStartDate.setMonth(missionStartDate.getMonth() - 2); // Assume 2 months ago
          
          const expeditionNumber = this.generateExpeditionNumber();
          const countryFlag = this.generateCountryFlag(launchLibraryData.country || launchLibraryData.nationality || 'Unknown');
          const launchVehicle = this.generateRealisticLaunchVehicle(astronaut.craft, launchLibraryData.agency || '');
          
          return {
            name: astronaut.name,
            country: launchLibraryData.country || launchLibraryData.nationality || 'Unknown',
            countryFlag: countryFlag,
            agency: launchLibraryData.agency || 'Unknown',
            position: launchLibraryData.position || 'Astronaut',
            spaceCraft: astronaut.craft,
            launchDate: missionStartDate.getTime(),
            totalDaysInSpace: launchLibraryData.totalDaysInSpace || Math.floor(Math.random() * 300) + 30,
            expeditionShort: `Exp ${expeditionNumber}`,
            expeditionLong: `Expedition ${expeditionNumber}`,
            expeditionPatch: '',
            missionPatch: '',
            profileImageLink,
            profileImageThumbnail,
            socialMediaPlatforms: {
              instagram: '',
              twitter: '',
              facebook: '',
            },
            iss: astronaut.craft === 'ISS',
            launchVehicle: launchVehicle,
            
            // Enhanced biographical data from Launch Library
            age: launchLibraryData.age,
            bio: launchLibraryData.bio,
            nationality: launchLibraryData.nationality || launchLibraryData.country,
            flightsCount: launchLibraryData.flightsCount,
            spacewalksCount: launchLibraryData.spacewalksCount,
            evaTime: launchLibraryData.evaTime,
            timeInSpace: launchLibraryData.timeInSpace,
            inSpace: launchLibraryData.inSpace,
            
            // Real-time status simulation
            currentActivity: currentActivity as any,
            healthStatus: 'nominal' as any,
            lastUpdate: new Date().toISOString(),
            
            // Mission data
            currentMission: {
              name: `${astronaut.craft} Operations`,
              description: `Scientific research and maintenance operations aboard the ${astronaut.craft}`,
              startDate: missionStartDate.getTime(),
              expectedDuration: 180, // 6 months typical
              status: 'active' as any
            },
            
            // Enhanced agency data
            agencyType: launchLibraryData.agencyType,
            agencyId: launchLibraryData.agencyId
          };
        })
      );
      
      const currentExpedition = this.generateExpeditionNumber();
      const expeditionStart = new Date();
      expeditionStart.setMonth(expeditionStart.getMonth() - 2);
      const expeditionEnd = new Date();
      expeditionEnd.setMonth(expeditionEnd.getMonth() + 4);
      
      const result = {
        numberOfPeople: openNotifyResponse.number,
        expedition: {
          expeditionNumber: currentExpedition.toString(),
          expeditionStartDate: expeditionStart.getTime(),
          expeditionEndDate: expeditionEnd.getTime(),
        },
        astronauts: mergedAstronauts,
      };
      
      // Check data completeness
      const completeness = this.calculateDataCompleteness(mergedAstronauts);
      console.log(`[Data Quality] Astronaut data completeness: ${completeness}%`);
      
      return result;
    };
    
    try {
      // Use the new cache manager for comprehensive caching
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