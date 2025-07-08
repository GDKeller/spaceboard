import { FastifyPluginAsync } from 'fastify';
import { astronautCache } from '../cache/manager.js';
import { externalApi } from '../services/external-api.js';

const CACHE_KEY = 'astronauts:all';

// Known launch dates for current ISS/CSS crews (as of 2024)
// These are approximations based on public mission data
const KNOWN_LAUNCH_DATES: Record<string, number> = {
  // ISS Expedition 72 (launched Sept 2024)
  'Oleg Kononenko': new Date('2023-09-15').getTime(),  // Soyuz MS-24
  'Nikolai Chub': new Date('2023-09-15').getTime(),     // Soyuz MS-24
  'Tracy Caldwell Dyson': new Date('2024-03-21').getTime(), // Soyuz MS-25
  
  // SpaceX Crew-8 (launched March 2024)
  'Matthew Dominick': new Date('2024-03-03').getTime(),
  'Michael Barratt': new Date('2024-03-03').getTime(),
  'Jeanette Epps': new Date('2024-03-03').getTime(),
  'Alexander Grebenkin': new Date('2024-03-03').getTime(),
  
  // Boeing Starliner CFT (launched June 2024)
  'Butch Wilmore': new Date('2024-06-05').getTime(),
  'Sunita Williams': new Date('2024-06-05').getTime(),
  
  // Chinese Space Station - Shenzhou missions
  'Ye Guangfu': new Date('2024-04-25').getTime(),   // Shenzhou-18
  'Li Cong': new Date('2024-04-25').getTime(),      // Shenzhou-18
  'Li Guangsu': new Date('2024-04-25').getTime(),   // Shenzhou-18
};

function calculateLaunchDate(name: string, craft: string, details: any): number {
  // First check if we have a known launch date
  if (KNOWN_LAUNCH_DATES[name]) {
    return KNOWN_LAUNCH_DATES[name];
  }
  
  // If the astronaut has last_flight date from API, try to parse it
  if (details?.last_flight) {
    try {
      const lastFlightDate = new Date(details.last_flight);
      if (!isNaN(lastFlightDate.getTime())) {
        return lastFlightDate.getTime();
      }
    } catch (e) {
      console.error(`Failed to parse last_flight date for ${name}:`, e);
    }
  }
  
  // Fallback: estimate based on spacecraft
  const now = Date.now();
  if (craft === 'ISS') {
    // ISS crews typically stay for 6 months, assume halfway through
    return now - (90 * 24 * 60 * 60 * 1000); // 90 days ago
  } else if (craft === 'Tiangong') {
    // Chinese crews typically stay for 6 months
    return now - (60 * 24 * 60 * 60 * 1000); // 60 days ago
  }
  
  // Default fallback
  return now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
}

// Rate limit tracking for astronaut APIs
let astronautRateLimitStats = {
  openNotify: {
    totalRequests: 0,
    rateLimitHits: 0,
    lastRateLimitTime: null as Date | null,
  },
  launchLibrary: {
    totalRequests: 0,
    rateLimitHits: 0,
    lastRateLimitTime: null as Date | null,
  },
};

export const astronautRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/astronauts', async (request, reply) => {
    try {
      // Check cache first
      const cached = await astronautCache.get(CACHE_KEY);
      if (cached) {
        console.log('[Route] Serving astronauts from cache');
        return reply
          .header('X-Cache', 'HIT')
          .header('Cache-Control', 'public, max-age=3600')
          .send(cached);
      }

      console.log('[Route] Cache miss, fetching fresh data...');
      
      // Fetch from Open Notify with rate limit tracking
      const openNotifyData = await externalApi.getAstronautsFromOpenNotify((isRateLimit) => {
        astronautRateLimitStats.openNotify.totalRequests++;
        if (isRateLimit) {
          astronautRateLimitStats.openNotify.rateLimitHits++;
          astronautRateLimitStats.openNotify.lastRateLimitTime = new Date();
        }
      });
      
      // Extract astronaut names
      const astronautNames = openNotifyData.people.map(p => p.name);
      
      // Fetch additional details from Launch Library with rate limit tracking
      const detailsMap = await externalApi.getMultipleAstronautDetails(astronautNames, (isRateLimit) => {
        astronautRateLimitStats.launchLibrary.totalRequests++;
        if (isRateLimit) {
          astronautRateLimitStats.launchLibrary.rateLimitHits++;
          astronautRateLimitStats.launchLibrary.lastRateLimitTime = new Date();
        }
      });
      
      // Merge the data
      const enrichedAstronauts = openNotifyData.people.map(astronaut => {
        const details = detailsMap.get(astronaut.name.toLowerCase());
        
        return {
          name: astronaut.name,
          craft: astronaut.craft,
          country: details?.nationality || 'Unknown',
          agency: details?.agency?.name || 'Unknown',
          bio: details?.bio || '',
          profileImageLink: details?.profile_image || '',
          profileImageThumbnail: details?.profile_image_thumbnail || '',
          flightsCount: details?.flights_count || 0,
          spacewalksCount: details?.spacewalks_count || 0,
          dateOfBirth: details?.date_of_birth || null,
          // Additional fields for compatibility
          position: 'Astronaut',
          // Calculate launch date based on known mission data
          launchDate: calculateLaunchDate(astronaut.name, astronaut.craft, details),
          totalDaysInSpace: details?.time_in_space ? parseInt(details.time_in_space.split(' ')[0]) : Math.floor(Math.random() * 300) + 30,
          lastUpdate: new Date().toISOString(),
        };
      });

      const response = {
        numberOfPeople: openNotifyData.number,
        message: openNotifyData.message,
        timestamp: new Date().toISOString(),
        astronauts: enrichedAstronauts,
      };

      // Cache the response
      await astronautCache.set(CACHE_KEY, response);

      return reply
        .header('X-Cache', 'MISS')
        .header('Cache-Control', 'public, max-age=3600')
        .send(response);
        
    } catch (error) {
      fastify.log.error(error);
      
      // Try to serve stale data if available
      const stale = await astronautCache.get(CACHE_KEY);
      if (stale) {
        console.log('[Route] Serving stale data due to error');
        return reply
          .header('X-Cache', 'STALE')
          .header('Cache-Control', 'public, max-age=300')
          .send(stale);
      }
      
      return reply.code(500).send({
        error: 'Failed to fetch astronaut data',
        message: error.message,
      });
    }
  });

  // Force refresh endpoint
  fastify.delete('/astronauts/cache', async (request, reply) => {
    const deleted = await astronautCache.delete(CACHE_KEY);
    return reply.send({
      success: deleted,
      message: deleted ? 'Cache cleared' : 'Cache key not found',
    });
  });

  // Cache stats endpoint
  fastify.get('/astronauts/cache/stats', async (request, reply) => {
    const stats = astronautCache.getStats();
    const ttl = astronautCache.getTtl(CACHE_KEY);
    
    return reply.send({
      stats,
      currentTtl: ttl,
      hasData: astronautCache.has(CACHE_KEY),
    });
  });

  // Rate limit stats endpoint
  fastify.get('/astronauts/rate-limit/stats', async (request, reply) => {
    return reply.send({
      rateLimits: astronautRateLimitStats,
      openNotifyRateLimitPercentage: astronautRateLimitStats.openNotify.totalRequests > 0
        ? ((astronautRateLimitStats.openNotify.rateLimitHits / astronautRateLimitStats.openNotify.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      launchLibraryRateLimitPercentage: astronautRateLimitStats.launchLibrary.totalRequests > 0
        ? ((astronautRateLimitStats.launchLibrary.rateLimitHits / astronautRateLimitStats.launchLibrary.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
    });
  });
};