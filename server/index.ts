import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config.js';
import { astronautRoutes } from './routes/astronauts.js';
import { imageRoutes } from './routes/images.js';
import { healthRoutes } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function start() {
  try {
    // Register CORS
    await server.register(cors, {
      origin: (origin, cb) => {
        // Allow localhost in development
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:3000',
        ];
        
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    });

    // Serve cached images
    await server.register(fastifyStatic, {
      root: join(__dirname, '..', 'public', 'cache', 'images'),
      prefix: '/cache/images/',
      decorateReply: false,
    });

    // Register routes
    await server.register(astronautRoutes, { prefix: '/api' });
    await server.register(imageRoutes, { prefix: '/api' });
    await server.register(healthRoutes, { prefix: '/api' });

    // Start server
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });

    console.log(`🚀 Server running at http://${config.host}:${config.port}`);
    console.log(`📊 Health check: http://${config.host}:${config.port}/api/health`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    await server.close();
    process.exit(0);
  });
});

start();