import React from 'react';
import Astronaut from './Astronaut';
import { useAstronauts } from '../hooks/useAstronauts';
import { RefreshButton, RefreshStatus } from './RefreshButton';
import './AstronautGrid.css';

const AstronautGrid: React.FC = () => {
  const { data, isLoading, error, refetch } = useAstronauts();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-700 rounded-full border-t-purple-500 animate-spin"></div>
        <span className="text-lg text-gray-400">Loading astronauts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg p-6 mx-auto mt-8 text-center border border-red-800 rounded-lg bg-red-900/20">
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-semibold text-red-400">Error loading astronaut data</h3>
          <p className="text-gray-400">{error.message}</p>
        </div>
        <button 
          className="px-6 py-2 font-medium text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          onClick={refetch}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.astronauts.length === 0) {
    return (
      <div className="py-16 text-lg text-center text-gray-400">
        <p>No astronauts in space at the moment.</p>
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
    <div className="px-4 mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-gray-100">
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text">
              {data.numberOfPeople}
            </span>
            {' '}People in Space
          </h2>
          
          {/* Station Summary Cards */}
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(groupedAstronauts).map(([craft, astronauts]) => {
              const info = stationInfo[craft as keyof typeof stationInfo];
              return (
                <div 
                  key={craft} 
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border ${info?.borderColor || 'border-gray-600'} ${info?.bgColor || 'bg-gray-900/50'} backdrop-blur-sm transition-all duration-200 hover:scale-105`}
                >
                  <span className="text-xs font-mono text-gray-400">{info?.code || 'UNK'}</span>
                  <span className="font-medium text-gray-200">{craft}</span>
                  <span className="px-2 py-0.5 bg-black/30 rounded-full text-sm font-bold">{astronauts.length}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <RefreshButton
              onRefresh={refetch}
              isLoading={isLoading}
              variant="secondary"
              size="sm"
              showStats={false}
              lastUpdate={data.astronauts[0]?.lastUpdate}
            />
            
            <RefreshStatus
              isLoading={isLoading}
              error={error}
              lastUpdate={data.astronauts[0]?.lastUpdate}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-12">
        {Object.entries(groupedAstronauts).map(([craft, astronauts], index) => {
          const info = stationInfo[craft as keyof typeof stationInfo] || {
            name: craft,
            icon: '🌌',
            gradient: 'from-purple-500 to-pink-600',
            borderColor: 'border-purple-500/30',
            bgColor: 'bg-purple-950/20',
            glowColor: 'rgba(147, 51, 234, 0.1)',
            description: 'Spacecraft',
            altitude: 'Unknown',
            velocity: 'Unknown',
            flag: '🌐',
            agencies: 'Unknown'
          };

          return (
            <React.Fragment key={craft}>
              {/* Separator between stations */}
              {index > 0 && (
                <div className="station-separator">
                  <div className="station-separator-icon">
                    <span className="text-xs font-mono text-gray-500">◆</span>
                  </div>
                </div>
              )}

              <div 
                className={`station-group station-${craft.toLowerCase()} relative rounded-2xl border-2 ${info.borderColor} ${info.bgColor} backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl`}
                style={{
                  '--station-color': craft === 'ISS' ? '#3b82f6' : '#ef4444',
                  '--station-glow': info.glowColor,
                  boxShadow: `0 0 50px ${info.glowColor}`
                } as React.CSSProperties}
              >
                {/* Enhanced Station Header */}
                <div className="station-header">
                  <div className="absolute top-4 right-4 text-xs font-mono text-gray-500">{info.region}</div>
                  <div className="station-title">
                    <div className="station-logo">
                      <span className="text-2xl font-mono font-bold">{info.code}</span>
                    </div>
                    <div className="station-info">
                      <h3 className={`station-name bg-gradient-to-r ${info.gradient} bg-clip-text text-transparent`}>
                        {info.name}
                      </h3>
                      <div className="text-xs font-mono text-gray-400 mb-2">{info.designation}</div>
                      <div className="station-details">
                        <div className="station-detail">
                          <span className="text-xs font-mono">ALT</span>
                          <span>{info.altitude}</span>
                        </div>
                        <div className="station-detail">
                          <span className="text-xs font-mono">VEL</span>
                          <span>{info.velocity}</span>
                        </div>
                        <div className="station-detail">
                          <span className="text-xs font-mono">CREW</span>
                          <span>{astronauts.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-mono text-gray-500">{info.agencies}</div>
                </div>

                {/* Astronaut Grid */}
                <div className="grid gap-4 p-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {astronauts.map((astronaut) => (
                    <Astronaut 
                      key={astronaut.name} 
                      astronaut={astronaut}
                    />
                  ))}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default AstronautGrid;