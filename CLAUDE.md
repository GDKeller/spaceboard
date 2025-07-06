# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies for both frontend and server
npm run install:all

# Development servers
npm run dev           # Frontend only (http://localhost:5173)
npm run dev:server    # Server only (http://localhost:4108)
npm run dev:all       # Both frontend and server concurrently

# Production builds
npm run build         # Frontend build (TypeScript check + Vite build)
npm run build:server  # Server build
npm run build:all     # Build both frontend and server

# Other commands
npm run preview       # Preview production frontend build
npm run lint          # Run ESLint
npm run cache:clear   # Clear client-side cache
```

## Architecture Overview

### System Architecture
```
Frontend (React)          Backend (Fastify)         External APIs
     │                         │                         │
     ├──────fetch──────────────┤                         │
     │                         ├────────fetch────────────┤
     │                         │                         │
     │◄─────cached data────────┤◄───────fresh data──────┤
     │                         │                         │
                               └──► Cache Storage
                                    - Memory (node-cache)
                                    - Disk (images)
```

### Application Flow
1. **Entry Point**: `src/main.tsx` renders the root App component in StrictMode
2. **Main Component**: `src/App.tsx` displays the Vite/React logos and renders `AstronautGrid`
3. **Data Fetching**: `AstronautGrid` fetches data from local server at `http://localhost:4108/api/astronauts`
4. **Server Processing**: Fastify server checks cache, fetches from external APIs if needed
5. **Display**: Individual `Astronaut` components are rendered with cached images

### Component Hierarchy
```
App (src/App.tsx)
└── AstronautGrid (src/components/AstronautGrid.tsx)
    └── Astronaut[] (src/components/Astronaut.tsx)
```

### API Integration
- **Local Server**: `http://localhost:4108/api/astronauts` (proxies external APIs)
- **External APIs**: Open Notify and SpaceDevs Launch Library (handled by server)
- **Data Flow**: Component → Server → Cache → External API (if cache miss)
- **Image Proxy**: All astronaut images served through `/api/images/proxy`

### TypeScript Configuration
- Strict mode enabled
- Target: ES2020
- JSX: react-jsx transform
- No unused locals/parameters allowed

## Key Development Notes

### Frontend
- Components use React functional components with TypeScript (`React.FC`)
- State management via React hooks (useState, useEffect)
- Custom caching hooks (`useCachedImage`) for image optimization
- CSS modules for component styling
- Service layer pattern for API communication

### Backend Server
- Fastify server with TypeScript on port 4108
- Two-tier caching strategy (memory + disk)
- Health check endpoints for monitoring
- CORS configured for local development
- Graceful error handling and fallbacks

### Caching Strategy
- **Astronaut Data**: 6-hour TTL in memory cache
- **Images**: 24-hour TTL with permanent disk storage
- **Stale-While-Revalidate**: Serves stale data while fetching fresh
- **Cache Headers**: Proper HTTP caching for browser optimization

### Performance Optimizations
- Parallel data fetching from multiple sources
- Image proxy reduces external requests
- Browser cache integration
- Automatic cache warming
- Request deduplication