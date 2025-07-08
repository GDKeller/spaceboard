import React from 'react';
import { useAstronauts } from '../hooks/useAstronauts';
import StatsGrid from './StatsGrid';
import StationSummary from './StationSummary';
import StationGroup from './StationGroup';
import './AstronautGrid.css';

const AstronautGrid: React.FC = () => {
  const { data, isLoading, error, refetch } = useAstronauts();
  
  
  // Clear cache function
  const clearCache = async () => {
    console.log('Starting cache clear...');
    
    // Get all localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('spaceboard') || key.includes('astronaut'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage too
    sessionStorage.clear();
    console.log('SessionStorage cleared');
    
    // Clear IndexedDB if it exists
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name?.includes('spaceboard') || db.name?.includes('astronaut')) {
          console.log('Deleting IndexedDB:', db.name);
          await indexedDB.deleteDatabase(db.name);
        }
      }
    }
    
    console.log(`Cache clear complete! Removed ${keysToRemove.length} localStorage keys. Refreshing...`);
    
    // Hard reload to bypass browser cache
    window.location.reload(true);
  };

  if (isLoading) {
    return (
      <div className="tactical-panel">
        <div className="px-12 py-10">
          <div className="flex items-center gap-4">
            <span className="status-led bg-standby animate-pulse"></span>
            <span className="text-sm text-gray-500 uppercase tracking-wider">RETRIEVING PERSONNEL MANIFEST...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tactical-panel alert-critical">
        <div className="p-12">
          <div className="flex items-center gap-4 mb-8">
            <span className="status-led bg-critical"></span>
            <span className="text-sm uppercase tracking-wider">MANIFEST RETRIEVAL FAILURE</span>
          </div>
          <p className="text-xs text-gray-400 font-mono mb-8">ERROR: {error.message}</p>
          <button
            className="btn-tactical px-8 py-3"
            onClick={refetch}
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.astronauts.length === 0) {
    return (
      <div className="tactical-panel">
        <div className="px-12 py-16">
          <p className="text-center text-sm text-gray-500 uppercase tracking-wider">NO ACTIVE PERSONNEL IN ORBIT</p>
        </div>
      </div>
    );
  }

  // Group astronauts by spacecraft
  const groupedAstronauts = data.astronauts.reduce((groups, astronaut) => {
    const craft = astronaut.craft || astronaut.spaceCraft || 'Unknown';
    if (!groups[craft]) {
      groups[craft] = [];
    }
    groups[craft].push(astronaut);
    return groups;
  }, {} as Record<string, typeof data.astronauts>);

  // Station metadata
  const stationInfo = {
    ISS: {
      name: 'International Space Station',
      code: 'ISS',
      gradient: 'from-blue-500 to-cyan-600',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-950/20',
      glowColor: 'rgba(59, 130, 246, 0.1)',
      designation: 'ZARYA/UNITY',
      altitude: '408 km',
      velocity: '27,600 km/h',
      region: 'EARTH-LEO',
      agencies: 'NASA • ESA • JAXA • CSA • ROSCOSMOS'
    },
    Tiangong: {
      name: 'Tiangong Space Station',
      code: 'CSS',
      gradient: 'from-red-500 to-orange-600',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-950/20',
      glowColor: 'rgba(239, 68, 68, 0.1)',
      designation: 'TIANHE CORE',
      altitude: '390 km',
      velocity: '27,500 km/h',
      region: 'EARTH-LEO',
      agencies: 'CNSA'
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-12 mb-32">
        {/* Stats Grid - Moved to top */}
        <StatsGrid
          numberOfPeople={data.numberOfPeople}
          stationCount={Object.keys(groupedAstronauts).length}
        />

        {/* Tactical Header */}
        <div className="tactical-panel mb-4">
          <div className="px-12 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-sm font-tactical uppercase tracking-wider text-gray-400">
                ORBITAL PERSONNEL MANIFEST • LIVE TRACKING
              </h2>
              <div className="flex items-center gap-8">
                <span className="text-xs text-gray-600">LAST UPDATE: {new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full">
          {/* Station Summary */}
          <StationSummary
            groupedAstronauts={groupedAstronauts}
            stationInfo={stationInfo}
          />

          {/* Refresh Controls */}
          <div className="flex justify-center ml-auto gap-4">
            <button
              onClick={clearCache}
              className="btn-tactical px-10 py-3 text-sm"
            >
              PURGE LOCAL CACHE
            </button>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="btn-tactical px-10 py-3 text-sm"
            >
              REFRESH MANIFEST
            </button>
          </div>
        </div>
      </div>

      {/* Station Groups */}
      <div className="space-y-12 mt-16">
        {Object.entries(groupedAstronauts).map(([craft, astronauts], index) => {
          const info = stationInfo[craft as keyof typeof stationInfo] || {
            name: craft,
            code: 'UNK',
            designation: 'UNKNOWN PLATFORM',
            altitude: '---',
            velocity: '---',
            region: 'UNKNOWN',
            agencies: 'UNSPECIFIED'
          };

          return (
            <StationGroup
              key={craft}
              craft={craft}
              astronauts={astronauts}
              info={info}
              showSeparator={index > 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AstronautGrid;