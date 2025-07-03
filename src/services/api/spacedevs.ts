import { BaseApiClient } from './base';
import { ApiResponse, Astronaut, Launch, SpaceAgency } from '../../types';

interface SpaceDevsAstronaut {
  id: number;
  name: string;
  nationality: string;
  profile_image: string;
  bio: string;
  agency: {
    id: number;
    name: string;
    abbrev: string;
  };
  flights_count: number;
  spacewalks_count: number;
  spacewalk_hours: number;
}

interface SpaceDevsLaunch {
  id: string;
  name: string;
  status: {
    id: number;
    name: string;
    abbrev: string;
    description: string;
  };
  net: string;
  window_start: string;
  window_end: string;
  launch_service_provider: {
    id: number;
    name: string;
    type: string;
  };
  rocket: {
    configuration: {
      name: string;
      family: string;
    };
  };
  mission: {
    name: string;
    description: string;
    type: string;
    orbit: {
      name: string;
      abbrev: string;
    };
  };
  pad: {
    name: string;
    location: {
      name: string;
      country_code: string;
    };
  };
  image: string;
}

export class SpaceDevsClient extends BaseApiClient {
  constructor(apiKey?: string) {
    super({
      name: 'SpaceDevs',
      url: 'https://ll.thespacedevs.com/2.2.0',
      api_key: apiKey,
      rate_limit: 1000 // 1 request per second for free tier
    });
    
    // Use longer cache for SpaceDevs due to rate limits
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async searchAstronautByName(name: string): Promise<ApiResponse<Astronaut | null>> {
    const response = await this.fetchWithRateLimit<{ results: SpaceDevsAstronaut[] }>(
      `/astronaut/?search=${encodeURIComponent(name)}&limit=1`
    );

    if (response.error || !response.data.results.length) {
      return {
        data: null,
        error: response.error || 'Astronaut not found',
        timestamp: response.timestamp
      };
    }

    const spaceDevsAstronaut = response.data.results[0];
    const astronaut: Astronaut = {
      id: `spacedevs-${spaceDevsAstronaut.id}`,
      name: spaceDevsAstronaut.name,
      nationality: spaceDevsAstronaut.nationality,
      image_url: spaceDevsAstronaut.profile_image,
      bio: spaceDevsAstronaut.bio,
      eva_hours: spaceDevsAstronaut.spacewalk_hours,
      missions_count: spaceDevsAstronaut.flights_count,
      craft: '', // Would need to fetch current assignment
      status: {
        current_activity: 'working',
        health_status: 'nominal',
        location: 'ISS', // Would need to determine from current mission
        last_update: new Date().toISOString()
      },
      agency: {
        id: spaceDevsAstronaut.agency.id.toString(),
        name: spaceDevsAstronaut.agency.name,
        abbrev: spaceDevsAstronaut.agency.abbrev,
        country_code: '' // Not provided in this endpoint
      }
    };

    return {
      data: astronaut,
      timestamp: response.timestamp,
      cached: response.cached
    };
  }

  async getUpcomingLaunches(limit: number = 10): Promise<ApiResponse<Launch[]>> {
    const response = await this.fetchWithRateLimit<{ results: SpaceDevsLaunch[] }>(
      `/launch/upcoming/?limit=${limit}`
    );

    if (response.error) {
      return {
        data: [],
        error: response.error,
        timestamp: response.timestamp
      };
    }

    const launches: Launch[] = response.data.results.map(launch => ({
      id: launch.id,
      name: launch.name,
      status: {
        id: launch.status.id,
        name: launch.status.name as any,
        abbrev: launch.status.abbrev,
        description: launch.status.description
      },
      net: launch.net,
      window_start: launch.window_start,
      window_end: launch.window_end,
      launch_service_provider: {
        id: launch.launch_service_provider.id,
        name: launch.launch_service_provider.name,
        type: launch.launch_service_provider.type as any,
        country_code: '',
        abbrev: ''
      },
      rocket: {
        id: 0,
        configuration: {
          id: 0,
          name: launch.rocket.configuration.name,
          family: launch.rocket.configuration.family,
          full_name: launch.rocket.configuration.name,
          variant: '',
          reusable: false,
          stages: 0,
          boosters: 0
        },
        reused: false
      },
      mission: {
        id: 0,
        name: launch.mission.name,
        description: launch.mission.description,
        type: launch.mission.type as any,
        orbit: {
          id: 0,
          name: launch.mission.orbit.name,
          abbrev: launch.mission.orbit.abbrev
        },
        payloads: []
      },
      pad: {
        id: 0,
        name: launch.pad.name,
        location: {
          name: launch.pad.location.name,
          country_code: launch.pad.location.country_code,
          latitude: 0,
          longitude: 0
        },
        complex: '',
        status: 'active'
      },
      webcast_live: false,
      image_url: launch.image
    }));

    return {
      data: launches,
      timestamp: response.timestamp,
      cached: response.cached
    };
  }
}