export const API_CONFIG = {
  // Use local server in development, production URL in production
  BASE_URL: import.meta.env.PROD 
    ? import.meta.env.VITE_API_URL || 'https://api.spaceboard.app'
    : 'http://localhost:4108',
  
  // API endpoints
  ENDPOINTS: {
    ASTRONAUTS: '/api/astronauts',
    IMAGE_PROXY: '/api/images/proxy',
    HEALTH: '/api/health',
  },
  
  // Request configuration
  REQUEST: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
} as const;

export type ApiConfig = typeof API_CONFIG;