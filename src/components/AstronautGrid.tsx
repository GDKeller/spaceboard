import React from 'react';
import Astronaut from './Astronaut';
import { useAstronauts } from '../hooks/useAstronauts';
import './AstronautGrid.css';

const AstronautGrid: React.FC = () => {
  const { data, isLoading, error, refetch } = useAstronauts();

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
      <div className="space-y-12">
        {/* Tactical Header */}
        <div className="tactical-panel">
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
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Active Personnel */}
          <div className="tactical-panel">
            <div className="px-12 py-10">
              <div className="text-label mb-4">ACTIVE PERSONNEL</div>
              <div className="text-5xl font-mono text-data-bright tabular-nums">
                {data.numberOfPeople.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-600 mt-3">IN ORBIT</div>
            </div>
          </div>
          
          {/* Mission Status */}
          <div className="tactical-panel">
            <div className="px-12 py-10">
              <div className="text-label mb-4">MISSION STATUS</div>
              <div className="flex items-center gap-4 mt-6">
                <span className="status-led bg-nominal animate-pulse"></span>
                <span className="text-base text-nominal uppercase">ALL SYSTEMS GO</span>
              </div>
              <div className="text-xs text-gray-600 mt-3">NO ALERTS</div>
            </div>
          </div>
          
          {/* Station Count */}
          <div className="tactical-panel">
            <div className="px-12 py-10">
              <div className="text-label mb-4">ACTIVE STATIONS</div>
              <div className="text-5xl font-mono text-data-bright tabular-nums">
                {Object.keys(groupedAstronauts).length.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-600 mt-3">ORBITAL PLATFORMS</div>
            </div>
          </div>
        </div>
        
        {/* Station Summary */}
        <div className="flex flex-wrap justify-center gap-6">
          {Object.entries(groupedAstronauts).map(([craft, astronauts]) => {
            const info = stationInfo[craft as keyof typeof stationInfo];
            return (
              <div 
                key={craft} 
                className="tactical-panel flex items-center gap-6"
              >
                <div className="px-8 py-4 flex items-center gap-6">
                  <span className="text-label">{info?.code || 'UNK'}</span>
                  <span className="text-sm text-gray-300">{craft}</span>
                  <span className="px-4 py-2 bg-expanse/20 text-expanse font-mono text-sm">{astronauts.length}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Refresh Controls */}
        <div className="flex justify-center">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="btn-tactical px-10 py-3 text-sm"
          >
            REFRESH MANIFEST
          </button>
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
            <React.Fragment key={craft}>
              {/* Station separator */}
              {index > 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-full h-px bg-gray-800"></div>
                </div>
              )}

              <div className="tactical-panel">
                {/* Station Header */}
                <div className="px-12 py-10 border-b border-gray-800">
                  <div className="flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-tactical text-gray-200 uppercase tracking-wider">
                          {info.name}
                        </h3>
                        <div className="text-xs text-gray-500 mt-3">{info.designation} • {info.agencies}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-mono text-expanse tabular-nums">
                        {astronauts.length.toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-600 uppercase mt-2">CREW</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-10 mt-6 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">ALTITUDE:</span>
                      <span className="font-mono text-gray-400">{info.altitude}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">VELOCITY:</span>
                      <span className="font-mono text-gray-400">{info.velocity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">REGION:</span>
                      <span className="text-gray-400">{info.region}</span>
                    </div>
                  </div>
                </div>

                {/* Personnel Grid */}
                <div className="p-12">
                  <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {astronauts.map((astronaut) => (
                      <Astronaut 
                        key={astronaut.name} 
                        astronaut={astronaut}
                      />
                    ))}
                  </div>
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