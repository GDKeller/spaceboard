export const CACHE_CONFIG = {
  // Cache directories
  CACHE_DIR: './cache',
  API_CACHE_DIR: './cache/api',
  ASSETS_CACHE_DIR: './cache/assets',
  
  // Cache TTL settings (in milliseconds)
  DEFAULT_TTL: 6 * 60 * 60 * 1000, // 6 hours
  ASTRONAUT_DATA_TTL: 6 * 60 * 60 * 1000, // 6 hours
  ASSET_TTL: 24 * 60 * 60 * 1000, // 24 hours for images
  
  // Size limits
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_ASSET_SIZE: 5 * 1024 * 1024, // 5MB per asset
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    BACKOFF_MULTIPLIER: 2,
    MAX_BACKOFF_TIME: 32 * 1000, // 32 seconds
    INITIAL_BACKOFF: 1000, // 1 second
    CIRCUIT_BREAKER_THRESHOLD: 5, // failures before circuit opens
    CIRCUIT_BREAKER_TIMEOUT: 60 * 1000, // 1 minute
  },
  
  // API endpoints
  APIS: {
    OPEN_NOTIFY: 'http://api.open-notify.org/astros.json',
    LAUNCH_LIBRARY: 'https://ll.thespacedevs.com/2.2.0/astronaut/',
  },
  
  // Cache keys
  CACHE_KEYS: {
    ASTRONAUT_DATA: 'astronaut-data-v2',
    ASSET_METADATA: 'asset-metadata',
    RATE_LIMIT_STATE: 'rate-limit-state',
    CACHE_STATS: 'cache-stats',
  },
  
  // Image optimization
  IMAGE_OPTIMIZATION: {
    ENABLE_WEBP: true,
    THUMBNAIL_SIZE: 150,
    QUALITY: 85,
    MAX_WIDTH: 800,
    MAX_HEIGHT: 800,
  },
  
  // Development settings
  DEV_MODE: import.meta.env.DEV,
  FORCE_REFRESH: import.meta.env.VITE_FORCE_CACHE_REFRESH === 'true',
  DISABLE_CACHE: import.meta.env.VITE_DISABLE_CACHE === 'true',
  
  // Logging
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  ENABLE_CACHE_LOGGING: import.meta.env.VITE_ENABLE_CACHE_LOGGING === 'true' || true, // Temporarily enabled for debugging
} as const;

export type CacheConfig = typeof CACHE_CONFIG;