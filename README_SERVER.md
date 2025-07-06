# SpaceBoard Server

A caching server that proxies and caches astronaut data and images to reduce API calls to external services.

## Architecture

```
Client (React) → Fastify Server → Cache (node-cache) → External APIs
                       ↓
                 Disk Storage (images)
```

## Features

- **Data Caching**: 6-hour TTL for astronaut data
- **Image Proxy & Caching**: Permanent disk storage for astronaut images
- **Two-Tier Caching**: Server cache + browser cache headers
- **Graceful Degradation**: Serves stale data if external APIs are down
- **Rate Limiting**: Protects external APIs from excessive requests

## Setup

1. Install dependencies:
```bash
npm run install:all
```

2. Start both frontend and server:
```bash
npm run dev:all
```

Or run separately:
```bash
# Terminal 1 - Frontend (port 3108)
npm run dev

# Terminal 2 - Server (port 4108)
npm run dev:server
```

## API Endpoints

### Astronaut Data
- `GET /api/astronauts` - Get all astronauts (cached)
- `DELETE /api/astronauts/cache` - Clear astronaut cache
- `GET /api/astronauts/cache/stats` - Cache statistics

### Image Proxy
- `GET /api/images/proxy?url=<image-url>` - Proxy and cache external image
- `GET /api/images/:hash` - Get cached image by hash
- `DELETE /api/images/cache` - Clear image cache
- `GET /api/images/cache/stats` - Image cache statistics

### Health
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Environment Variables

See `server/.env` for configuration options:
- `PORT` - Server port (default: 4108)
- `CACHE_TTL_ASTRONAUTS` - Astronaut data TTL in ms
- `CACHE_TTL_IMAGES` - Image cache TTL in ms

## Cache Headers

The server sets appropriate cache headers:
- `Cache-Control: public, max-age=3600` for astronaut data
- `Cache-Control: public, max-age=86400` for images
- `X-Cache: HIT/MISS/STALE` to indicate cache status

## Scaling

When ready to scale:
1. Replace `node-cache` with Redis
2. Use CDN for image serving
3. Add horizontal scaling with load balancer
4. Consider edge caching with Cloudflare Workers