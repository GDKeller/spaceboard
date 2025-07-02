import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AstronautGrid from './components/AstronautGrid'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <a href="https://vite.dev" target="_blank">
                <img src={viteLogo} className="logo" alt="Vite logo" />
              </a>
              <a href="https://react.dev" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">SpaceBoard</h1>
            <p className="text-gray-400">Real-time astronaut tracking dashboard</p>
          </div>
          
          <AstronautGrid />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
