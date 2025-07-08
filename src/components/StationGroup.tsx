import React from 'react';
import Astronaut from './Astronaut';
import ISSStatus from './ISSStatus';

interface StationInfo {
  name: string;
  code: string;
  gradient?: string;
  borderColor?: string;
  bgColor?: string;
  glowColor?: string;
  designation: string;
  altitude: string;
  velocity: string;
  region: string;
  agencies: string;
}

interface StationGroupProps {
  craft: string;
  astronauts: any[];
  info: StationInfo;
  showSeparator: boolean;
}

const StationGroup: React.FC<StationGroupProps> = ({ craft, astronauts, info, showSeparator }) => {
  return (
    <React.Fragment>
      {/* Station separator */}
      {showSeparator && (
        <div className="flex items-center justify-center py-0">
          <div className="w-full h-px bg-gray-800"></div>
        </div>
      )}

      {/* ISS Status Panel - only for ISS */}
      {craft === 'ISS' && (
        <div className="mb-4">
          <ISSStatus />
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
};

export default StationGroup;