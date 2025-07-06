import { FastifyInstance } from 'fastify';
import got from 'got';
import NodeCache from 'node-cache';

const issCache = new NodeCache({ 
  stdTTL: 1,
  checkperiod: 2,
  useClones: false,
});

// Rate limit tracking
let rateLimitStats = {
  totalRequests: 0,
  rateLimitHits: 0,
  lastRateLimitTime: null as Date | null,
  consecutiveRateLimits: 0,
};

interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: 'daylight' | 'eclipsed';
  footprint: number;
  timestamp: number;
  solar_lat: number;
  solar_lon: number;
  units: 'kilometers';
}

export async function issRoutes(fastify: FastifyInstance) {
  fastify.get('/iss/now', async (request, reply) => {
    const cacheKey = 'iss-position';
    rateLimitStats.totalRequests++;
    
    try {
      const cached = issCache.get<ISSPosition>(cacheKey);
      if (cached) {
        fastify.log.info('Returning cached ISS position');
        return reply.header('X-Cache', 'HIT').send(cached);
      }

      fastify.log.info('Fetching fresh ISS position data');
      
      const response = await got('https://api.wheretheiss.at/v1/satellites/25544', {
        timeout: { request: 5000 },
        responseType: 'json',
      });

      const data = response.body as ISSPosition;
      
      issCache.set(cacheKey, data);
      rateLimitStats.consecutiveRateLimits = 0; // Reset on successful request
      
      return reply.header('X-Cache', 'MISS').send(data);
    } catch (error) {
      const statusCode = (error as any)?.response?.statusCode;
      
      if (statusCode === 429) {
        rateLimitStats.rateLimitHits++;
        rateLimitStats.lastRateLimitTime = new Date();
        rateLimitStats.consecutiveRateLimits++;
        
        fastify.log.warn(`ISS API rate limit hit (${rateLimitStats.rateLimitHits} total, ${rateLimitStats.consecutiveRateLimits} consecutive) - returning cached data`);
        const staleData = issCache.get<ISSPosition>(cacheKey);
        if (staleData) {
          return reply.header('X-Cache', 'RATE_LIMITED').send(staleData);
        }
      }
      
      fastify.log.error({ error, statusCode }, 'Failed to fetch ISS position');
      
      const staleData = issCache.get<ISSPosition>(cacheKey);
      if (staleData) {
        fastify.log.info('Returning stale ISS data due to error');
        return reply.header('X-Cache', 'STALE').send(staleData);
      }
      
      return reply.code(503).send({ 
        error: 'Unable to fetch ISS position data',
        message: error instanceof Error ? error.message : 'Unknown error',
        rateLimited: statusCode === 429,
      });
    }
  });

  // Rate limit monitoring endpoint
  fastify.get('/iss/stats', async (request, reply) => {
    const cacheStats = issCache.getStats();
    return reply.send({
      rateLimits: rateLimitStats,
      cache: cacheStats,
      rateLimitPercentage: rateLimitStats.totalRequests > 0 
        ? ((rateLimitStats.rateLimitHits / rateLimitStats.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
    });
  });
}