import { FastifyPluginAsync } from 'fastify';
import { astronautCache, imageCache } from '../cache/manager.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (request, reply) => {
    const astronautStats = astronautCache.getStats();
    const imageStats = imageCache.getStats();
    
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cache: {
        astronauts: astronautStats,
        images: imageStats,
      },
    });
  });

  fastify.get('/health/ready', async (request, reply) => {
    return reply.send({ ready: true });
  });

  fastify.get('/health/live', async (request, reply) => {
    return reply.send({ alive: true });
  });
};