export interface CacheConfig {
  ttl: number;
  checkperiod?: number;
  maxKeys?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  cacheConfig: {
    astronauts: CacheConfig;
    images: CacheConfig;
  };
  apis: {
    openNotify: string;
    launchLibrary: string;
  };
}

export interface OpenNotifyResponse {
  message: string;
  number: number;
  people: Array<{
    name: string;
    craft: string;
  }>;
}

export interface LaunchLibraryAstronaut {
  id: number;
  name: string;
  nationality?: string;
  date_of_birth?: string;
  bio?: string;
  profile_image?: string;
  profile_image_thumbnail?: string;
  flights_count?: number;
  spacewalks_count?: number;
  agency?: {
    name: string;
    type: string;
  };
}

export interface CachedImage {
  originalUrl: string;
  localPath: string;
  contentType: string;
  size: number;
  hash: string;
  cachedAt: number;
}