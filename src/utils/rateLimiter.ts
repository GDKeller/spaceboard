import { CACHE_CONFIG } from '../config/cache.config';

export interface RateLimitState {
  requestCount: number;
  windowStart: number;
  failureCount: number;
  lastFailure: number;
  backoffUntil: number;
  circuitBreakerOpen: boolean;
  circuitBreakerOpenedAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
}

export class RateLimiter {
  private state: Map<string, RateLimitState> = new Map();
  private readonly config = CACHE_CONFIG.RATE_LIMIT;

  constructor() {
    this.loadState();
    // Cleanup old state periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  private loadState(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('rate_limit_state');
        if (stored) {
          const stateArray = JSON.parse(stored);
          this.state = new Map(stateArray);
        }
      }
    } catch (error) {
      console.error('[RateLimiter] Failed to load state:', error);
    }
  }

  private saveState(): void {
    try {
      if (typeof window !== 'undefined') {
        const stateArray = Array.from(this.state.entries());
        localStorage.setItem('rate_limit_state', JSON.stringify(stateArray));
      }
    } catch (error) {
      console.error('[RateLimiter] Failed to save state:', error);
    }
  }

  private getOrCreateState(endpoint: string): RateLimitState {
    let state = this.state.get(endpoint);
    
    if (!state) {
      state = {
        requestCount: 0,
        windowStart: Date.now(),
        failureCount: 0,
        lastFailure: 0,
        backoffUntil: 0,
        circuitBreakerOpen: false,
        circuitBreakerOpenedAt: 0,
      };
      this.state.set(endpoint, state);
    }
    
    return state;
  }

  private isWithinWindow(state: RateLimitState): boolean {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute
    return (now - state.windowStart) < windowDuration;
  }

  private resetWindow(state: RateLimitState): void {
    state.requestCount = 0;
    state.windowStart = Date.now();
  }

  private calculateBackoff(failureCount: number): number {
    const backoff = Math.min(
      this.config.INITIAL_BACKOFF * Math.pow(this.config.BACKOFF_MULTIPLIER, failureCount - 1),
      this.config.MAX_BACKOFF_TIME
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * backoff;
    return Math.floor(backoff + jitter);
  }

  private shouldOpenCircuitBreaker(state: RateLimitState): boolean {
    return state.failureCount >= this.config.CIRCUIT_BREAKER_THRESHOLD;
  }

  private canCloseCircuitBreaker(state: RateLimitState): boolean {
    const now = Date.now();
    return (now - state.circuitBreakerOpenedAt) >= this.config.CIRCUIT_BREAKER_TIMEOUT;
  }

  checkRateLimit(endpoint: string): RateLimitResult {
    const state = this.getOrCreateState(endpoint);
    const now = Date.now();

    // Check circuit breaker
    if (state.circuitBreakerOpen) {
      if (this.canCloseCircuitBreaker(state)) {
        // Half-open state - allow one request to test
        state.circuitBreakerOpen = false;
        state.failureCount = 0;
        console.log(`[RateLimiter] Circuit breaker half-open for ${endpoint}`);
      } else {
        const retryAfter = Math.max(0, state.circuitBreakerOpenedAt + this.config.CIRCUIT_BREAKER_TIMEOUT - now);
        return {
          allowed: false,
          retryAfter,
          reason: 'Circuit breaker open due to repeated failures'
        };
      }
    }

    // Check backoff period
    if (now < state.backoffUntil) {
      const retryAfter = state.backoffUntil - now;
      return {
        allowed: false,
        retryAfter,
        reason: `Backoff period active (attempt ${state.failureCount})`
      };
    }

    // Reset window if needed
    if (!this.isWithinWindow(state)) {
      this.resetWindow(state);
    }

    // Check rate limit
    if (state.requestCount >= this.config.MAX_REQUESTS_PER_MINUTE) {
      const retryAfter = Math.max(0, state.windowStart + 60000 - now);
      return {
        allowed: false,
        retryAfter,
        reason: 'Rate limit exceeded'
      };
    }

    // Allow the request
    state.requestCount++;
    this.saveState();
    
    return { allowed: true };
  }

  recordSuccess(endpoint: string): void {
    const state = this.getOrCreateState(endpoint);
    
    // Reset failure count on success
    if (state.failureCount > 0) {
      console.log(`[RateLimiter] Success recorded for ${endpoint}, resetting failure count`);
      state.failureCount = 0;
      state.backoffUntil = 0;
    }
    
    // Close circuit breaker if it was open
    if (state.circuitBreakerOpen) {
      state.circuitBreakerOpen = false;
      console.log(`[RateLimiter] Circuit breaker closed for ${endpoint}`);
    }
    
    this.saveState();
  }

  recordFailure(endpoint: string, statusCode?: number): void {
    const state = this.getOrCreateState(endpoint);
    const now = Date.now();
    
    state.failureCount++;
    state.lastFailure = now;
    
    // Calculate backoff time
    const backoffDuration = this.calculateBackoff(state.failureCount);
    state.backoffUntil = now + backoffDuration;
    
    console.log(`[RateLimiter] Failure recorded for ${endpoint}: ${state.failureCount} failures, backing off for ${backoffDuration}ms`);
    
    // Check if we should open circuit breaker
    if (this.shouldOpenCircuitBreaker(state)) {
      state.circuitBreakerOpen = true;
      state.circuitBreakerOpenedAt = now;
      console.log(`[RateLimiter] Circuit breaker opened for ${endpoint} after ${state.failureCount} failures`);
    }
    
    // Handle specific status codes
    if (statusCode) {
      if (statusCode === 429) {
        // Rate limited - increase backoff
        state.backoffUntil = now + (backoffDuration * 2);
        console.log(`[RateLimiter] 429 response for ${endpoint}, extended backoff to ${backoffDuration * 2}ms`);
      } else if (statusCode >= 500) {
        // Server error - circuit breaker logic applies
        console.log(`[RateLimiter] Server error ${statusCode} for ${endpoint}`);
      }
    }
    
    this.saveState();
  }

  getBackoffTime(endpoint: string): number {
    const state = this.state.get(endpoint);
    if (!state) return 0;
    
    const now = Date.now();
    return Math.max(0, state.backoffUntil - now);
  }

  isCircuitOpen(endpoint: string): boolean {
    const state = this.state.get(endpoint);
    return state ? state.circuitBreakerOpen : false;
  }

  getFailureCount(endpoint: string): number {
    const state = this.state.get(endpoint);
    return state ? state.failureCount : 0;
  }

  reset(endpoint: string): void {
    const state = this.getOrCreateState(endpoint);
    
    state.requestCount = 0;
    state.windowStart = Date.now();
    state.failureCount = 0;
    state.lastFailure = 0;
    state.backoffUntil = 0;
    state.circuitBreakerOpen = false;
    state.circuitBreakerOpenedAt = 0;
    
    console.log(`[RateLimiter] Reset state for ${endpoint}`);
    this.saveState();
  }

  resetAll(): void {
    this.state.clear();
    this.saveState();
    console.log('[RateLimiter] Reset all rate limiting state');
  }

  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [endpoint, state] of this.state) {
      // Remove old entries that haven't been used recently
      const timeSinceLastActivity = Math.max(
        now - state.windowStart,
        now - state.lastFailure,
        now - state.circuitBreakerOpenedAt
      );
      
      if (timeSinceLastActivity > staleThreshold) {
        this.state.delete(endpoint);
      }
    }
    
    this.saveState();
  }

  getStats(): Record<string, RateLimitState> {
    const stats: Record<string, RateLimitState> = {};
    for (const [endpoint, state] of this.state) {
      stats[endpoint] = { ...state };
    }
    return stats;
  }

  async withRateLimit<T>(
    endpoint: string,
    operation: () => Promise<T>,
    options: { maxRetries?: number; onRetry?: (attempt: number, retryAfter: number) => void } = {}
  ): Promise<T> {
    const { maxRetries = 3, onRetry } = options;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      const rateLimitResult = this.checkRateLimit(endpoint);
      
      if (!rateLimitResult.allowed) {
        if (attempt >= maxRetries) {
          throw new Error(`Rate limit exceeded for ${endpoint}: ${rateLimitResult.reason}`);
        }
        
        const retryAfter = rateLimitResult.retryAfter || 1000;
        
        if (onRetry) {
          onRetry(attempt + 1, retryAfter);
        }
        
        console.log(`[RateLimiter] Waiting ${retryAfter}ms before retry ${attempt + 1}/${maxRetries} for ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        attempt++;
        continue;
      }
      
      try {
        const result = await operation();
        this.recordSuccess(endpoint);
        return result;
      } catch (error) {
        this.recordFailure(endpoint, error instanceof Error && 'status' in error ? (error as any).status : undefined);
        
        if (attempt >= maxRetries) {
          throw error;
        }
        
        attempt++;
      }
    }
    
    throw new Error(`Max retries exceeded for ${endpoint}`);
  }
}

export const rateLimiter = new RateLimiter();