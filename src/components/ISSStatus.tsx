import React from 'react';
import { useISS } from '../hooks/useISS';

const ISSStatus: React.FC = () => {
  const { data, isLoading, error } = useISS();

  if (isLoading) {
    return (
      <div className="tactical-panel">
        <div className="px-12 py-10">
          <div className="flex items-center gap-4">
            <span className="status-led bg-standby animate-pulse"></span>
            <span className="text-sm text-gray-500 uppercase tracking-wider">ACQUIRING ISS TELEMETRY...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tactical-panel alert-critical">
        <div className="px-12 py-10">
          <div className="flex items-center gap-4">
            <span className="status-led bg-critical"></span>
            <span className="text-sm uppercase tracking-wider">TELEMETRY LINK FAILURE</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="tactical-panel">
      <div className="relative">
        {/* Header */}
        <div className="px-12 py-8 border-b border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8">
              <h2 className="text-sm font-tactical uppercase tracking-wider text-gray-400">
                ISS ZARYA • TRACKING STATION ALPHA
              </h2>
              <div className="flex items-center gap-4">
                <span className="status-led bg-nominal animate-pulse"></span>
                <span className="text-sm text-nominal">SIGNAL LOCK</span>
              </div>
            </div>
            <span className="text-xs text-gray-600 font-mono">
              NORAD: 25544
            </span>
          </div>
        </div>
        
        {/* Telemetry Grid */}
        <div className="p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Velocity */}
            <div className="space-y-2">
              <div className="text-label">VELOCITY</div>
              <div className="text-3xl font-mono text-data-bright tabular-nums">
                {Math.round(data.velocity).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">KM/H</div>
            </div>
            
            {/* Altitude */}
            <div className="space-y-2">
              <div className="text-label">ALTITUDE</div>
              <div className="text-3xl font-mono text-data-bright tabular-nums">
                {Math.round(data.altitude)}
              </div>
              <div className="text-xs text-gray-600">KM ASL</div>
            </div>
            
            {/* Footprint */}
            <div className="space-y-2">
              <div className="text-label">FOOTPRINT</div>
              <div className="text-3xl font-mono text-data-bright tabular-nums">
                {Math.round(data.footprint)}
              </div>
              <div className="text-xs text-gray-600">KM RADIUS</div>
            </div>
            
            {/* Visibility */}
            <div className="space-y-2">
              <div className="text-label">VISIBILITY</div>
              <div className="text-2xl font-mono uppercase">
                <span className={`${data.visibility === 'daylight' ? 'text-caution' : 'text-standby'}`}>
                  {data.visibility}
                </span>
              </div>
              <div className="text-xs text-gray-600">SOLAR ANGLE</div>
            </div>
          </div>
          
          {/* Coordinates */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-10">
              <div className="flex items-baseline gap-4">
                <span className="text-label">LAT:</span>
                <span className="font-mono text-xl text-data tabular-nums">
                  {data.latitude >= 0 ? '+' : ''}{data.latitude.toFixed(4)}°
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-label">LON:</span>
                <span className="font-mono text-xl text-data tabular-nums">
                  {data.longitude >= 0 ? '+' : ''}{data.longitude.toFixed(4)}°
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Corner decorations */}
        <div className="tactical-corners"></div>
      </div>
    </div>
  );
};

export default ISSStatus;