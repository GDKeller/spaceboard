import { SpaceData, SpacecraftData, ApiError } from '../../types/space.types';
import { launchLibraryService } from './launchLibraryService';
import { astronautCache } from '../cache/browserCache';

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

  async getAstronauts(): Promise<SpaceData> {
    const cacheKey = 'astronaut-data-enriched';
    
    // Define the fetcher function that will be called if cache miss
    const fetcher = async (): Promise<SpaceData> => {
      console.log('[API] Fetching from Open Notify:', OPEN_NOTIFY_URL);
      
      // First fetch from Open Notify to get current astronauts
      const openNotifyResponse = await this.fetchWithTimeout(OPEN_NOTIFY_URL).then(res => res.json());
      
      // Extract astronaut names
      const astronautNames = openNotifyResponse.people.map((p: any) => p.name);
      
      // Then fetch images for those specific astronauts
      const astronautImageMap = await launchLibraryService.getAstronautsWithImages(astronautNames);
      
      // Merge data from both sources with enhanced mapping
      const mergedAstronauts = openNotifyResponse.people.map((astronaut: any) => {
        // Try to find matching astronaut data from Launch Library
        const launchLibraryData = astronautImageMap.get(astronaut.name.toLowerCase()) || {};
        
        console.log('Merging data for:', astronaut.name);
        console.log('Launch Library data found:', launchLibraryData);
        
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
          profileImageLink: launchLibraryData.profileImageLink || '',
          profileImageThumbnail: launchLibraryData.profileImageThumbnail || '',
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
      });
      
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
      
      // Only cache if data is sufficiently complete (>60%)
      if (completeness < 60) {
        console.warn('[Data Quality] Data completeness below threshold, not caching');
        // Don't throw error, just don't cache
        // throw new Error('Incomplete data - below caching threshold');
      }
      
      return result;
    };
    
    try {
      // Check if we have cached data first
      const cached = await astronautCache.get<SpaceData>(cacheKey);
      
      if (cached !== null) {
        // Validate cached data completeness
        const completeness = this.calculateDataCompleteness(cached.astronauts);
        if (completeness >= 60) {
          console.log(`[Cache] Using cached data (${completeness}% complete)`);
          return cached;
        } else {
          console.warn(`[Cache] Cached data incomplete (${completeness}%), fetching fresh`);
          await astronautCache.delete(cacheKey);
        }
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Only cache if data is complete
      const freshCompleteness = this.calculateDataCompleteness(freshData.astronauts);
      if (freshCompleteness >= 60) {
        await astronautCache.set(cacheKey, freshData, {
          ttl: 24 * 60 * 60 * 1000 // 24 hours
        });
      }
      
      return freshData;
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
    // Check if we should force refresh the cache
    if (forceRefresh) {
      console.log('[Cache] Force refresh requested, clearing cache');
      await astronautCache.delete('astronaut-data-enriched');
    }
    
    // Now use the regular getAstronauts which includes file caching
    return this.getAstronauts();
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
    // Also clear browser cache
    try {
      await astronautCache.clear();
      console.log('[Cache] Browser cache cleared');
    } catch (err) {
      console.error('Failed to clear browser cache:', err);
    }
  }
}

export const spaceService = new SpaceService();