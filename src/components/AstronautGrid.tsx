import React from 'react';
import Astronaut from './Astronaut';
import { useAstronauts } from '../hooks/useAstronauts';

const AstronautGrid: React.FC = () => {
  const { data, isLoading, error, refetch } = useAstronauts();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin"></div>
        <span className="text-lg text-gray-400">Loading astronauts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-8 p-6 bg-red-900/20 border border-red-800 rounded-lg text-center">
        <div className="mb-4">
          <h3 className="text-red-400 text-xl font-semibold mb-2">Error loading astronaut data</h3>
          <p className="text-gray-400">{error.message}</p>
        </div>
        <button 
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          onClick={refetch}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.astronauts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-lg">
        <p>No astronauts in space at the moment.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-100">
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            {data.numberOfPeople}
          </span>
          {' '}People in Space
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.astronauts.map((astronaut) => (
          <Astronaut 
            key={astronaut.name} 
            astronaut={astronaut}
          />
        ))}
      </div>
    </div>
  );
};

export default AstronautGrid;
