# ADR-001: Space API Integration Strategy

**Status**: Proposed  
**Date**: January 2025  
**Author**: Engineering Team

## Context

SpaceBoard currently uses Open Notify API for basic ISS tracking and astronaut data. Research has identified multiple APIs offering enhanced capabilities including real-time velocity, pass predictions, space weather, and launch tracking. We need to decide on an integration strategy that balances features, reliability, performance, and cost.

## Decision

We will implement a **multi-layered API strategy** with the following approach:

### 1. API Hierarchy with Fallback Chains

```
Primary APIs (Free, No Auth):
├── Open Notify (current ISS position, astronauts)
└── Where the ISS at? (enhanced position data)

Secondary APIs (Free with Registration):
├── NASA APIs (space weather, imagery)
├── SpaceX API (launch data)
└── N2YO (pass predictions)

Fallback Strategy:
Position: Where ISS at → Open Notify → Cached data
Astronauts: Open Notify → Launch Library → Cached data
Weather: NASA DONKI → Cached data
```

### 2. Server-Side API Management

- All external API calls proxied through our Fastify server
- API keys stored server-side only (never exposed to client)
- Centralized rate limit management
- Unified error handling and fallback logic

### 3. Differentiated Caching Strategy

| Data Type | Cache TTL | Rationale |
|-----------|-----------|-----------|
| ISS Position | 1-5 seconds | Changes rapidly |
| Velocity/Altitude | 5 seconds | Changes rapidly |
| Astronaut Data | 6 hours | Rarely changes |
| Pass Predictions | 1 hour | Computed data |
| Space Weather | 15 minutes | Updates periodically |
| Launch Data | 1 hour | Schedule changes |

### 4. Progressive Enhancement

Core functionality remains available without enhanced features:
- Basic ISS tracking works without location
- No features require user accounts
- Graceful degradation when APIs unavailable

### 5. Privacy-First Location Handling

- Geolocation is opt-in only
- Location data never sent to external services
- Pass predictions computed server-side
- User preferences stored locally

## Consequences

### Positive
- Enhanced user experience with real-time data
- High reliability through fallback chains
- No API costs (using free tiers)
- Scalable architecture for future APIs
- Privacy protection for users

### Negative
- Increased server complexity
- More APIs to monitor and maintain
- Higher server resource usage
- Complex caching logic

### Neutral
- Development effort spread across multiple sprints
- Need for comprehensive API mocking in tests
- Documentation requirements increase

## Implementation Approach

1. **Phase 1**: Enhance core tracking with Where ISS at? API
2. **Phase 2**: Add user location features (pass predictions)
3. **Phase 3**: Integrate space weather data
4. **Phase 4**: Add launch tracking capabilities

## Alternatives Considered

1. **Single Premium API**: Use paid service like Aviation Edge
   - Rejected: Unnecessary cost for available free alternatives

2. **Client-Side API Calls**: Direct browser-to-API communication
   - Rejected: Exposes API keys, no fallback control

3. **GraphQL Aggregation Layer**: Build GraphQL API over REST endpoints
   - Rejected: Over-engineering for current needs

4. **WebSocket Streaming**: Real-time position updates via WebSocket
   - Deferred: Can be added later if needed

## References

- [SPACE_APIS_REFERENCE.md](../SPACE_APIS_REFERENCE.md)
- [NASA API Documentation](https://api.nasa.gov)
- [Open Notify API](http://open-notify.org/Open-Notify-API/)
- [Where the ISS at? API](https://wheretheiss.at/w/developer)