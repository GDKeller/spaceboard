import { Astronaut } from '../../types/space.types';

const LAUNCH_LIBRARY_API = '/api/launch-library/astronaut/';

interface LaunchLibraryAstronaut {
  id: number;
  name: string;
  status: {
    id: number;
    name: string;
  };
  type: {
    id: number;
    name: string;
  };
  in_space: boolean;
  nationality: string;
  age: number;
  bio: string;
  profile_image: string;
  profile_image_thumbnail: string;
  agency: {
    id: number;
    name: string;
    type: string;
  };
  flights_count: number;
  spacewalks_count: number;
  time_in_space: string;
  eva_time: string;
  social_media_links: any[];
}

interface LaunchLibraryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LaunchLibraryAstronaut[];
}

class LaunchLibraryService {
  private async fetchAstronautByName(name: string): Promise<LaunchLibraryAstronaut | null> {
    try {
      // Search for astronaut by name
      const url = `${LAUNCH_LIBRARY_API}?search=${encodeURIComponent(name)}&limit=1`;
      console.log('Searching for astronaut:', name);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        console.log('Found astronaut data for:', name, 'Image:', data.results[0].profile_image);
        return data.results[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching astronaut data for', name, error);
      return null;
    }
  }

  async getAstronautsWithImages(astronautNames: string[]): Promise<Map<string, Partial<Astronaut>>> {
    try {
      const astronautMap = new Map<string, Partial<Astronaut>>();
      
      // Fetch data for each astronaut in parallel
      const promises = astronautNames.map(name => this.fetchAstronautByName(name));
      const results = await Promise.all(promises);
      
      // Process results and build map
      results.forEach((astronaut, index) => {
        if (astronaut) {
          const astronautData: Partial<Astronaut> = {
            name: astronaut.name,
            country: astronaut.nationality,
            agency: astronaut.agency?.name || 'Unknown',
            profileImageLink: astronaut.profile_image || astronaut.profile_image_thumbnail || '',
            totalDaysInSpace: this.parseTimeInSpace(astronaut.time_in_space),
            position: astronaut.type?.name || 'Astronaut',
          };
          astronautMap.set(astronautNames[index].toLowerCase(), astronautData);
        }
      });
      
      return astronautMap;
    } catch (error) {
      console.error('Failed to get astronauts with images:', error);
      return new Map();
    }
  }

  private parseTimeInSpace(timeString: string): number {
    // Parse format like "P365DT12H30M" to days
    const match = timeString.match(/P(\d+)D/);
    return match ? parseInt(match[1]) : 0;
  }
}

export const launchLibraryService = new LaunchLibraryService();