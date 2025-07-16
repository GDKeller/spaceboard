# SpaceBoard

A real-time astronaut tracking dashboard showing current crew members aboard spacecraft, built with React, TypeScript, and Vite.

## Features

- **Real-time Astronaut Data**: Track current astronauts in space from multiple sources
- **Smart Caching System**: Two-tier caching with server-side proxy and browser cache
- **Image Optimization**: Cached astronaut images with automatic proxy and CDN-style serving
- **High Performance**: Sub-second load times with intelligent data fetching
- **Beautiful UI**: Space-themed interface with smooth animations

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│    Server    │────▶│External APIs│
│  (React)    │◀────│  (Fastify)   │◀────│(Open Notify)│
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Cache Storage │
                    │- Memory Cache│
                    │- Disk Images │
                    └──────────────┘
```

## Quick Start

```bash
# Install dependencies for both frontend and server
npm run install:all

# Start both frontend and server in development
npm run dev:all

# Or run separately:
npm run dev          # Frontend only (port 5173)
npm run dev:server   # Server only (port 4108)
```

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Setup

1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Start development: `npm run dev:all`

The application will be available at:
- Frontend: http://localhost:5173
- API Server: http://localhost:4108
- Health Check: http://localhost:4108/api/health

### Available Scripts

```bash
# Development
npm run dev           # Start frontend dev server
npm run dev:server    # Start backend server
npm run dev:all       # Start both concurrently

# Building
npm run build         # Build frontend for production
npm run build:server  # Build server for production
npm run build:all     # Build everything

# Other
npm run lint          # Run ESLint
npm run preview       # Preview production build
npm run cache:clear   # Clear client-side cache
```

## Server API

### Endpoints

#### Astronaut Data
- `GET /api/astronauts` - Get all astronauts (cached)
- `DELETE /api/astronauts/cache` - Clear astronaut cache
- `GET /api/astronauts/cache/stats` - Cache statistics

#### Image Proxy
- `GET /api/images/proxy?url=<url>` - Proxy and cache external image
- `GET /api/images/:hash` - Get cached image by hash
- `DELETE /api/images/cache` - Clear image cache
- `GET /api/images/cache/stats` - Image cache statistics

#### Health
- `GET /api/health` - Comprehensive health check
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Caching Strategy

1. **Server-Side Caching**
   - Astronaut data: 6-hour TTL with stale-while-revalidate
   - Images: 24-hour TTL with permanent disk storage
   - Automatic cache warming and background updates

2. **Client-Side Caching**
   - Browser cache headers for optimal performance
   - Service worker ready for offline support
   - LocalStorage for persistent asset URLs

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=4108
HOST=0.0.0.0

# Cache Configuration
CACHE_TTL_ASTRONAUTS=21600000  # 6 hours in ms
CACHE_TTL_IMAGES=86400000      # 24 hours in ms
CACHE_CHECK_PERIOD=600         # 10 minutes in seconds

# External APIs
OPEN_NOTIFY_API=http://api.open-notify.org/astros.json
LAUNCH_LIBRARY_API=https://ll.thespacedevs.com/2.2.0/astronaut/

# Development
NODE_ENV=development
LOG_LEVEL=info
```

## Production Deployment

### Building for Production

```bash
npm run build:all
```

This creates:
- `dist/` - Frontend production build
- `server/dist/` - Server production build

### Deployment Recommendations

1. **Frontend**: Deploy to CDN (Cloudflare Pages, Vercel, Netlify)
2. **Server**: Deploy to Node.js hosting (Railway, Render, Fly.io)
3. **Database**: Consider Redis for distributed caching
4. **Monitoring**: Add application monitoring (Sentry, DataDog)

### Scaling Considerations

When ready to scale:
1. Replace in-memory cache with Redis
2. Use CDN for image serving
3. Add horizontal scaling with load balancer
4. Implement edge caching with Cloudflare Workers

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS Modules** - Scoped styling

### Backend
- **Fastify** - High-performance Node.js server
- **node-cache** - In-memory caching
- **got** - HTTP client for external APIs
- **TypeScript** - Type safety

