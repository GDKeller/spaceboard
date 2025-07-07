import './App.css'
import { AstronautGrid } from './components/space'
import ErrorBoundary from './components/ErrorBoundary'
import ISSStatus from './components/ISSStatus'

function App() {
  return (
    <ErrorBoundary>
      <div className="app-container">
        <header className="app-header glass-panel">
          <div className="app-header-content">
            <h1 className="app-title display-text">
              <span className="text-primary">SPACE</span>BOARD
            </h1>
            <p className="app-subtitle data-text">
              REAL-TIME ORBITAL OPERATIONS MONITOR
            </p>
          </div>
          <div className="app-header-status">
            <div className="status-item">
              <span className="status-dot"></span>
              <span className="data-text">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>
        
        <main className="app-main">
          <ISSStatus />
          <AstronautGrid />
        </main>
        
        <div className="app-background">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
          <div className="gradient-mesh"></div>
          <div className="circuit-board"></div>
          <div className="orbital-rings"></div>
          <div className="data-flow-grid"></div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
