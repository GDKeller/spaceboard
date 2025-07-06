import React from 'react';
import { useISS } from '../hooks/useISS';

const ISSStatus: React.FC = () => {
  const { data, isLoading, error } = useISS();

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400">Loading ISS position...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-400">Unable to load ISS data</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-gray-300 font-medium">International Space Station</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {Math.round(data.velocity).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">km/h</div>
          <div className="text-xs text-gray-500">Velocity</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {Math.round(data.altitude)}
          </div>
          <div className="text-sm text-gray-400">km</div>
          <div className="text-xs text-gray-500">Altitude</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.round(data.footprint)}
          </div>
          <div className="text-sm text-gray-400">km</div>
          <div className="text-xs text-gray-500">Footprint</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-medium text-yellow-400 capitalize">
            {data.visibility}
          </div>
          <div className="text-xs text-gray-500">Visibility</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Latitude:</span>
            <span className="ml-2 text-gray-300">{data.latitude.toFixed(2)}°</span>
          </div>
          <div>
            <span className="text-gray-400">Longitude:</span>
            <span className="ml-2 text-gray-300">{data.longitude.toFixed(2)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ISSStatus;