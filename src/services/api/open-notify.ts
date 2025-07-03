import { BaseApiClient } from './base';
import { ApiResponse, Astronaut, OrbitalPosition } from '../../types';

interface OpenNotifyAstronaut {
  name: string;
  craft: string;
}

interface OpenNotifyResponse {
  people: OpenNotifyAstronaut[];
  number: number;
  message: string;
}

interface ISSPosition {
  iss_position: {
    latitude: string;
    longitude: string;
  };
  timestamp: number;
  message: string;
}

export class OpenNotifyClient extends BaseApiClient {
  constructor() {
    super({
      name: 'Open Notify',
      url: 'http://api.open-notify.org',
      rate_limit: 500
    });
  }

  async getAstronautsInSpace(): Promise<ApiResponse<Astronaut[]>> {
    const response = await this.fetchWithRateLimit<OpenNotifyResponse>('/astros.json');
    
    if (response.error) {
      return {
        data: [],
        error: response.error,
        timestamp: response.timestamp
      };
    }

    // Transform to our Astronaut interface
    const astronauts: Astronaut[] = response.data.people.map((person, index) => ({
      id: `open-notify-${index}`,
      name: person.name,
      craft: person.craft,
      status: {
        current_activity: 'working',
        health_status: 'nominal',
        location: person.craft,
        last_update: new Date().toISOString()
      }
    }));

    return {
      data: astronauts,
      timestamp: response.timestamp,
      cached: response.cached
    };
  }

  async getISSPosition(): Promise<ApiResponse<OrbitalPosition>> {
    const response = await this.fetchWithRateLimit<ISSPosition>('/iss-now.json');
    
    if (response.error) {
      return {
        data: null as any,
        error: response.error,
        timestamp: response.timestamp
      };
    }

    const position: OrbitalPosition = {
      timestamp: new Date(response.data.timestamp * 1000).toISOString(),
      latitude: parseFloat(response.data.iss_position.latitude),
      longitude: parseFloat(response.data.iss_position.longitude),
      altitude_km: 408, // ISS average altitude
      velocity_kms: 7.66, // ISS average velocity
      footprint_radius_km: 2200,
      solar_angle: 0, // Would need to calculate
      visibility: 'daylight' // Would need to calculate based on position
    };

    return {
      data: position,
      timestamp: response.timestamp,
      cached: response.cached
    };
  }
}