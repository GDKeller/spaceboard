import { FastifyPluginAsync } from 'fastify';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import got from 'got';
import { imageCache } from '../cache/manager.js';
import { CachedImage } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IMAGE_DIR = join(__dirname, '..', '..', 'public', 'cache', 'images');

// Ensure image directory exists
await fs.mkdir(IMAGE_DIR, { recursive: true });

export const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // Proxy and cache external images
  fastify.get('/images/proxy', async (request, reply) => {
    const { url } = request.query as { url?: string };
    
    if (!url) {
      return reply.code(400).send({ error: 'URL parameter is required' });
    }

    try {
      // Generate hash for the URL
      const urlHash = createHash('md5').update(url).digest('hex');
      const cacheKey = `image:${urlHash}`;
      
      // Check memory cache first
      const cached = await imageCache.get<CachedImage>(cacheKey);
      if (cached) {
        console.log(`[Image] Serving from cache: ${url}`);
        
        // Read file and serve
        const imageBuffer = await fs.readFile(cached.localPath);
        return reply
          .header('Content-Type', cached.contentType)
          .header('X-Cache', 'HIT')
          .header('Cache-Control', 'public, max-age=86400')
          .send(imageBuffer);
      }

      console.log(`[Image] Cache miss, downloading: ${url}`);
      
      // Download image
      const response = await got(url, {
        responseType: 'buffer',
        timeout: { request: 30000 },
        headers: {
          'User-Agent': 'SpaceBoard/1.0',
        },
      });

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const extension = extname(url) || '.jpg';
      const filename = `${urlHash}${extension}`;
      const localPath = join(IMAGE_DIR, filename);
      
      // Save to disk
      await fs.writeFile(localPath, response.body);
      
      // Create cache entry
      const cacheEntry: CachedImage = {
        originalUrl: url,
        localPath,
        contentType,
        size: response.body.length,
        hash: urlHash,
        cachedAt: Date.now(),
      };
      
      // Cache metadata
      await imageCache.set(cacheKey, cacheEntry);
      
      return reply
        .header('Content-Type', contentType)
        .header('X-Cache', 'MISS')
        .header('Cache-Control', 'public, max-age=86400')
        .send(response.body);
        
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Failed to fetch image',
        message: error.message,
      });
    }
  });

  // Get cached image by hash
  fastify.get('/images/:hash', async (request, reply) => {
    const { hash } = request.params as { hash: string };
    const cacheKey = `image:${hash}`;
    
    try {
      const cached = await imageCache.get<CachedImage>(cacheKey);
      if (!cached) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      
      const imageBuffer = await fs.readFile(cached.localPath);
      return reply
        .header('Content-Type', cached.contentType)
        .header('Cache-Control', 'public, max-age=86400')
        .send(imageBuffer);
        
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Failed to read cached image',
        message: error.message,
      });
    }
  });

  // Clear image cache
  fastify.delete('/images/cache', async (request, reply) => {
    try {
      // Clear memory cache
      await imageCache.clear();
      
      // Clear disk cache
      const files = await fs.readdir(IMAGE_DIR);
      await Promise.all(
        files.map(file => fs.unlink(join(IMAGE_DIR, file)).catch(() => {}))
      );
      
      return reply.send({
        success: true,
        message: 'Image cache cleared',
        filesDeleted: files.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Failed to clear image cache',
        message: error.message,
      });
    }
  });

  // Image cache stats
  fastify.get('/images/cache/stats', async (request, reply) => {
    try {
      const stats = imageCache.getStats();
      const files = await fs.readdir(IMAGE_DIR);
      
      let totalSize = 0;
      for (const file of files) {
        const stat = await fs.stat(join(IMAGE_DIR, file));
        totalSize += stat.size;
      }
      
      return reply.send({
        memoryCache: stats,
        diskCache: {
          files: files.length,
          totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'Failed to get cache stats',
        message: error.message,
      });
    }
  });
};