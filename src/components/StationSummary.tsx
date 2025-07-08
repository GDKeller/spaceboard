import React from 'react';

interface StationSummaryProps {
  groupedAstronauts: Record<string, any[]>;
  stationInfo: Record<string, { code?: string }>;
}

const StationSummary: React.FC<StationSummaryProps> = ({ groupedAstronauts, stationInfo }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
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
  );
};

export default StationSummary;