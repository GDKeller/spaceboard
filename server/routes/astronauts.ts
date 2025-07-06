import { FastifyPluginAsync } from 'fastify';
import { astronautCache } from '../cache/manager.js';
import { externalApi } from '../services/external-api.js';

const CACHE_KEY = 'astronauts:all';

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
          launchDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
          totalDaysInSpace: Math.floor(Math.random() * 300) + 30,
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