import './App.css'
import { AstronautGrid } from './components/space'
import ErrorBoundary from './components/ErrorBoundary'
import ISSStatus from './components/ISSStatus'
import { useEffect } from 'react'
import { rateLimiter } from './utils/rateLimiter'

function App() {
  useEffect(() => {
    // Clear stale rate limit state on app startup
    // This helps prevent persistent rate limit errors after development restarts
    const clearStaleRateLimitState = () => {
      const state = rateLimiter.getStats();
      const now = Date.now();
      const staleThreshold = 2 * 60 * 60 * 1000; // 2 hours
      
      // Check if any endpoints have old backoff times
      let hasStaleState = false;
      for (const [endpoint, endpointState] of Object.entries(state)) {
        if (endpointState.backoffUntil && (now - endpointState.backoffUntil) > staleThreshold) {
          hasStaleState = true;
          console.log(`[App] Found stale rate limit state for ${endpoint}`);
          break;
        }
      }
      
      if (hasStaleState) {
        console.log('[App] Clearing stale rate limit state...');
        rateLimiter.clearPersistedState();
      }
    };
    
    clearStaleRateLimitState();
  }, []);
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-void relative overflow-hidden p-8 lg:p-8">
        {/* Tactical background elements */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* HUD grid */}
          <div className="hud-grid z-0"></div>
          {/* Scan lines */}
          <div className="scan-line z-1"></div>
          <div className="scan-line z-1" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Main header */}
        <header className="relative z-10 tactical-panel mb-4 glass">
          <div className="px-12 py-10">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <h1 className="text-4xl font-tactical tracking-wider text-gray-100 mb-4">
                  <span className="text-expanse">ORBITAL</span>{' '}
                  <span className="text-gray-300">OPERATIONS</span>{' '}
                  <span className="text-expanse-light">COMMAND</span>
                </h1>
                <div className="flex items-center gap-8">
                  <span className="text-label">SECTOR: SOL</span>
                  <span className="text-label">•</span>
                  <span className="text-label">SUBSTATION: USA, CA</span>
                  <span className="text-label">•</span>
                  <span className="text-label">CLEARANCE: LEVEL 3</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <span className="status-led bg-nominal animate-pulse"></span>
                  <span className="text-sm text-nominal uppercase tracking-wider">SYSTEMS NOMINAL</span>
                </div>
                {/* Development utility - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => {
                      rateLimiter.clearPersistedState();
                      window.location.reload();
                    }}
                    className="px-3 py-1 text-xs bg-expanse/20 hover:bg-expanse/30 text-expanse border border-expanse/50 rounded transition-colors"
                    title="Clear rate limit state and reload"
                  >
                    CLEAR RATE LIMITS
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="tactical-corners"></div>
        </header>
        
        <main className="relative z-10 w-full">
          <div className="space-y-2">
            <AstronautGrid />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
