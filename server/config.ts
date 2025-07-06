import { ServerConfig } from './types/index.js';

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '4108', 10),
  host: process.env.HOST || '0.0.0.0',
  cacheConfig: {
    astronauts: {
      ttl: parseInt(process.env.CACHE_TTL_ASTRONAUTS || '21600000', 10), // 6 hours
      checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
    },
    images: {
      ttl: parseInt(process.env.CACHE_TTL_IMAGES || '86400000', 10), // 24 hours
      checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
    },
  },
  apis: {
    openNotify: process.env.OPEN_NOTIFY_API || 'http://api.open-notify.org/astros.json',
    launchLibrary: process.env.LAUNCH_LIBRARY_API || 'https://ll.thespacedevs.com/2.2.0/astronaut/',
  },
};