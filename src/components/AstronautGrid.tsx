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
      <div className="mb-12">
        {/* Header Section */}
        <div className="relative mb-12">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/20 to-transparent"></div>
          
          {/* Main header */}
          <div className="relative py-8">
            <div className="flex items-center justify-center mb-2">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-32"></div>
              <div className="mx-4">
                <div className="w-2 h-2 bg-cyan-400 rotate-45"></div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-32"></div>
            </div>
            
            <h2 className="text-3xl font-light tracking-[0.3em] text-cyan-100 text-center uppercase">
              Orbital Personnel Manifest
            </h2>
            
            <div className="flex items-center justify-center mt-2">
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent w-48"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
          {/* Active Count */}
          <div className="relative">
            <div className="bg-slate-900/50 border border-cyan-800/30 p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/50"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/50"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/50"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/50"></div>
              
              <div className="text-center">
                <div className="text-5xl font-extralight text-cyan-300 font-mono">{data.numberOfPeople}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-600 mt-2 font-light">Active Personnel</div>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="relative">
            <div className="bg-slate-900/50 border border-cyan-800/30 p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/50"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/50"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/50"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/50"></div>
              
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="text-lg font-light text-green-400 uppercase tracking-[0.2em]">Nominal</div>
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-600 font-light">System Status</div>
                <div className="flex gap-1 mt-3 justify-center">
                  <div className="w-12 h-0.5 bg-green-400/30"></div>
                  <div className="w-12 h-0.5 bg-green-400"></div>
                  <div className="w-12 h-0.5 bg-green-400/30"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expedition */}
          <div className="relative">
            <div className="bg-slate-900/50 border border-cyan-800/30 p-6 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/50"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/50"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/50"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/50"></div>
              
              <div className="text-center">
                <div className="text-5xl font-extralight text-cyan-300 font-mono">70</div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-600 mt-2 font-light">Expedition</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold text-gray-100 hidden">
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
                <div className="relative h-16 flex items-center justify-center my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-800/30 to-transparent"></div>
                  </div>
                  <div className="relative bg-slate-950 px-4">
                    <div className="w-1 h-1 bg-cyan-600/50 rounded-full"></div>
                  </div>
                </div>
              )}

              <div 
                className={`station-group station-${craft.toLowerCase()} relative border ${info.borderColor} bg-gradient-to-b from-slate-900/30 to-slate-950/50 backdrop-blur-sm overflow-hidden transition-all duration-300`}
                style={{
                  '--station-color': craft === 'ISS' ? '#3b82f6' : '#ef4444',
                  '--station-glow': info.glowColor
                } as React.CSSProperties}
              >
                {/* Enhanced Station Header */}
                <div className="station-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-slate-950/50 border border-cyan-800/30 flex items-center justify-center">
                          <span className="text-sm font-light text-cyan-400">{info.code}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400/50"></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-light text-cyan-100 tracking-wide">
                          {info.name}
                        </h3>
                        <div className="text-xs text-cyan-700 font-light tracking-wider uppercase mt-1">{info.designation}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-cyan-700 font-light uppercase tracking-wider">{info.region}</div>
                      <div className="text-2xl font-light text-cyan-300 font-mono mt-1">{astronauts.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-700 uppercase">ALT</span>
                      <span className="text-cyan-400 font-mono">{info.altitude}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-700 uppercase">VEL</span>
                      <span className="text-cyan-400 font-mono">{info.velocity}</span>
                    </div>
                    <div className="text-cyan-800 font-light">{info.agencies}</div>
                  </div>
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