import { FastifyInstance } from 'fastify';
import got from 'got';
import NodeCache from 'node-cache';

const issCache = new NodeCache({ 
  stdTTL: 5,
  checkperiod: 10,
  useClones: false,
});

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
      
      return reply.header('X-Cache', 'MISS').send(data);
    } catch (error) {
      fastify.log.error({ error }, 'Failed to fetch ISS position');
      
      const staleData = issCache.get<ISSPosition>(cacheKey);
      if (staleData) {
        fastify.log.info('Returning stale ISS data due to error');
        return reply.header('X-Cache', 'STALE').send(staleData);
      }
      
      return reply.code(503).send({ 
        error: 'Unable to fetch ISS position data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}