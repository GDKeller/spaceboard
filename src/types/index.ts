export * from './astronaut';
export * from './spacecraft';
export * from './orbit';
export * from './launch';
export * from './space-weather';

// Common types used across the application
export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
  cached?: boolean;
}

export interface RealtimeUpdate<T> {
  type: 'update' | 'delete' | 'create';
  data: T;
  timestamp: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface DataSource {
  name: string;
  url: string;
  api_key?: string;
  rate_limit?: number;
  last_fetch?: string;
}