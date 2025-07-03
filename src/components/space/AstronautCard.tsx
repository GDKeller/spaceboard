import React, { useState } from 'react';
import { Astronaut } from '../../types/space.types';
import { DataPanel } from '../core/DataPanel';
import './AstronautCard.css';

interface AstronautCardProps {
  astronaut: Astronaut;
}

// Simulated real-time activities for fallback
const workActivities = ['working', 'maintenance', 'communication'] as const;

const getRandomActivity = () => {
  const hour = new Date().getHours();
  // Simulate realistic schedule based on UTC time
  if (hour >= 22 || hour < 6) return 'sleeping';
  if (hour >= 6 && hour < 8) return 'meal';
  if (hour >= 11 && hour < 13) return 'exercise';
  if (hour >= 13 && hour < 14) return 'meal';
  if (hour >= 18 && hour < 19) return 'meal';
  
  // Random work activities during work hours
  return workActivities[Math.floor(Math.random() * workActivities.length)];
};

export const AstronautCard: React.FC<AstronautCardProps> = ({ astronaut }) => {
  // Use activity from service data, fallback to local simulation
  const [currentActivity] = useState(astronaut.currentActivity || getRandomActivity());
  const [imageError, setImageError] = useState(false);

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'eva': return 'var(--color-warning)';
      case 'sleeping': return 'var(--color-info)';
      case 'exercise': return 'var(--color-success)';
      case 'maintenance': return 'var(--color-secondary)';
      default: return 'var(--color-primary)';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDaysInSpace = (days: number) => {
    if (days === 0) return 'Just arrived';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  return (
    <DataPanel 
      className="astronaut-card" 
      variant={currentActivity === 'eva' ? 'warning' : 'default'}
      animated
    >
      <div className="astronaut-header">
        <div className="astronaut-image-container">
          {!imageError && astronaut.profileImageLink ? (
            <img 
              src={astronaut.profileImageLink} 
              alt={astronaut.name}
              className="astronaut-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="astronaut-initials">
              <span className="display-text">{getInitials(astronaut.name)}</span>
            </div>
          )}
          <div 
            className="status-indicator pulse" 
            style={{ backgroundColor: getActivityColor(currentActivity) }}
          />
        </div>
        
        <div className="astronaut-info">
          <h3 className="astronaut-name display-text">{astronaut.name}</h3>
          <div className="astronaut-meta">
            <span className="data-text text-primary">{astronaut.agency}</span>
            {astronaut.countryFlag && (
              <>
                <span className="separator">•</span>
                <span className="country-flag">{astronaut.countryFlag}</span>
                <span className="data-text">{astronaut.country}</span>
              </>
            )}
            {astronaut.age && (
              <>
                <span className="separator">•</span>
                <span className="data-text">Age {astronaut.age}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="astronaut-status">
        <div className="status-row">
          <span className="status-label data-text">STATUS</span>
          <span 
            className="status-value data-text" 
            style={{ color: getActivityColor(currentActivity) }}
          >
            {currentActivity.toUpperCase()}
          </span>
        </div>
        
        <div className="status-row">
          <span className="status-label data-text">LOCATION</span>
          <span className="status-value data-text text-primary">
            {astronaut.spaceCraft}
          </span>
        </div>
        
        <div className="status-row">
          <span className="status-label data-text">MISSION DAY</span>
          <span className="status-value data-text">
            {formatDaysInSpace(astronaut.totalDaysInSpace)}
          </span>
        </div>
        
        {astronaut.position && (
          <div className="status-row">
            <span className="status-label data-text">ROLE</span>
            <span className="status-value data-text">
              {astronaut.position}
            </span>
          </div>
        )}
        
        {astronaut.launchVehicle && (
          <div className="status-row">
            <span className="status-label data-text">VEHICLE</span>
            <span className="status-value data-text text-primary">
              {astronaut.launchVehicle}
            </span>
          </div>
        )}
      </div>

      {astronaut.expeditionLong && (
        <div className="astronaut-mission">
          <div className="mission-label data-text">CURRENT MISSION</div>
          <div className="mission-name display-text text-primary">
            {astronaut.expeditionLong}
          </div>
        </div>
      )}

      {/* Career Statistics */}
      {(astronaut.flightsCount || astronaut.spacewalksCount || astronaut.evaTime) && (
        <div className="astronaut-career">
          <div className="career-label data-text">CAREER STATS</div>
          <div className="career-stats">
            {astronaut.flightsCount && (
              <div className="career-stat">
                <div className="stat-value data-text text-primary">{astronaut.flightsCount}</div>
                <div className="stat-label">FLIGHTS</div>
              </div>
            )}
            {astronaut.spacewalksCount && (
              <div className="career-stat">
                <div className="stat-value data-text text-warning">{astronaut.spacewalksCount}</div>
                <div className="stat-label">EVAs</div>
              </div>
            )}
            {astronaut.evaTime && (
              <div className="career-stat">
                <div className="stat-value data-text text-success">{astronaut.evaTime}</div>
                <div className="stat-label">EVA TIME</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="astronaut-vitals">
        <div className="vital-item">
          <div className="vital-value data-text text-success">98%</div>
          <div className="vital-label">O₂ SAT</div>
        </div>
        <div className="vital-item">
          <div className="vital-value data-text text-success">72</div>
          <div className="vital-label">BPM</div>
        </div>
        <div className="vital-item">
          <div className="vital-value data-text text-success">36.8°</div>
          <div className="vital-label">TEMP</div>
        </div>
      </div>

      {/* Data stream effect */}
      <div className="data-stream-container">
        <div className="data-stream data-text">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.4}s` }}>
              ▪ {Math.random().toString(16).substr(2, 8)}
            </span>
          ))}
        </div>
      </div>
    </DataPanel>
  );
};