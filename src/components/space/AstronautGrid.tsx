import React, { useEffect } from 'react';
import { AstronautCard } from './AstronautCard';
import { useAstronauts } from '../../hooks/useAstronauts';
import './AstronautGrid.css';

export const AstronautGrid: React.FC = () => {
  const { data, isLoading, error, refetch } = useAstronauts();

  // Add scan line effect on mount
  useEffect(() => {
    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    document.body.appendChild(scanLine);
    
    return () => {
      document.body.removeChild(scanLine);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="astronaut-grid-loading">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text data-text">ESTABLISHING CONNECTION...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="astronaut-grid-error glass-panel">
        <div className="error-icon">⚠</div>
        <h3 className="error-title display-text">COMMUNICATION FAILURE</h3>
        <p className="error-message data-text">{error.message}</p>
        <button 
          className="retry-button"
          onClick={refetch}
        >
          <span className="display-text">RETRY CONNECTION</span>
        </button>
      </div>
    );
  }

  if (!data || data.astronauts.length === 0) {
    return (
      <div className="astronaut-grid-empty glass-panel">
        <p className="empty-message data-text">NO PERSONNEL DETECTED IN ORBIT</p>
      </div>
    );
  }

  return (
    <div className="astronaut-grid-container">
      <header className="astronaut-grid-header">
        <div className="header-content">
          <h2 className="header-title display-text">
            ORBITAL PERSONNEL MANIFEST
          </h2>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value data-text text-primary">{data.numberOfPeople}</span>
              <span className="stat-label data-text">ACTIVE</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value data-text text-success">NOMINAL</span>
              <span className="stat-label data-text">STATUS</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value data-text">{data.expedition?.expeditionNumber || 'N/A'}</span>
              <span className="stat-label data-text">EXPEDITION</span>
            </div>
            <div className="stat-divider"></div>
            <button 
              className="refresh-button"
              onClick={refetch}
              title="Force refresh data"
            >
              <span className="refresh-icon">⟳</span>
              <span className="data-text">REFRESH</span>
            </button>
          </div>
        </div>
        <div className="header-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-dot"></div>
          <div className="decoration-line"></div>
        </div>
      </header>

      <div className="astronaut-grid matrix-grid">
        <div className="grid-container fade-in-sequence">
          {data.astronauts.map((astronaut, index) => (
            <div 
              key={astronaut.name} 
              className="grid-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <AstronautCard astronaut={astronaut} />
            </div>
          ))}
        </div>
      </div>

      <footer className="astronaut-grid-footer">
        <div className="footer-content">
          <p className="data-text">
            LAST UPDATE: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
          </p>
          <button 
            className="refresh-button"
            onClick={refetch}
            title="Refresh data"
          >
            <span className="data-text">↻ REFRESH</span>
          </button>
        </div>
      </footer>
    </div>
  );
};