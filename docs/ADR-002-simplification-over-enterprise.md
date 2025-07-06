# ADR-002: Simplification Over Enterprise Architecture

## Status
Accepted

## Context
The initial implementation plan (Phase 0-4) was heavily overengineered for a simple ISS tracking application. It included enterprise-level infrastructure like OpenTelemetry, circuit breakers, feature flags, and complex caching strategies that would delay shipping actual value to users.

## Decision
We will follow these principles:
- **Simple > Clever**: No complex patterns unless proven necessary
- **Working > Perfect**: Ship features quickly, iterate based on real needs
- **YAGNI**: Don't build infrastructure for imaginary scale problems

### What We're Removing
1. **Phase 0 Infrastructure**: No OpenTelemetry, circuit breakers, or feature flags
2. **Complex Caching**: Just simple in-memory cache with TTL
3. **Over-resilience**: One API with cached fallback, not multiple fallback chains
4. **Privacy Theater**: No encryption for public ISS coordinates
5. **Monitoring Overkill**: Basic error logging only, no distributed tracing

### What We're Keeping
1. **Core Features**: Enhanced ISS tracking with velocity/altitude
2. **Simple Architecture**: Existing Fastify server with basic caching
3. **Good UX**: Clean, responsive UI with smooth updates
4. **Practical Features**: Pass predictions and basic space weather (if needed)

## Consequences
### Positive
- Ship features in days, not weeks
- Codebase remains simple and maintainable
- No unnecessary complexity to debug
- Can iterate based on actual user feedback

### Negative
- Won't scale to millions of users (but doesn't need to)
- No enterprise monitoring (can add if actually needed)
- Less "impressive" architecture diagram

## Implementation
Start immediately with Phase 1 features:
1. Add velocity/altitude from Where ISS at? API
2. Simple UI components
3. 5-second polling
4. Basic error handling

Skip all Phase 0 infrastructure setup.