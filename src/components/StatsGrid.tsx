import React from 'react';

interface StatsGridProps {
  numberOfPeople: number;
  stationCount: number;
}

const StatsGrid: React.FC<StatsGridProps> = ({ numberOfPeople, stationCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Active Personnel */}
      <div className="tactical-panel">
        <div className="px-12 py-10">
          <div className="text-label mb-4">ACTIVE PERSONNEL</div>
          <div className="text-5xl font-mono text-data-bright tabular-nums">
            {numberOfPeople.toString().padStart(2, '0')}
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
            {stationCount.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-600 mt-3">ORBITAL PLATFORMS</div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;