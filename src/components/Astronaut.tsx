import React from 'react';
import { Astronaut as AstronautType } from '../types/space.types';
import MagicCard from './MagicCard';

interface AstronautProps {
  astronaut: AstronautType;
}

const Astronaut: React.FC<AstronautProps> = ({ astronaut }) => {
  return (
    <MagicCard>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {astronaut.profileImageLink ? (
            <img 
              src={astronaut.profileImageLink} 
              alt={astronaut.name}
              className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-purple-500/50"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ${astronaut.profileImageLink ? 'hidden' : ''}`}>
            <span>{astronaut.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-100">{astronaut.name}</h3>
            <p className="text-sm text-gray-400">{astronaut.agency}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Spacecraft:</span>
            <span className="text-gray-200 font-semibold">{astronaut.spaceCraft}</span>
          </div>
          {astronaut.country !== 'Unknown' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Country:</span>
              <span className="text-gray-200">{astronaut.country}</span>
            </div>
          )}
          {astronaut.totalDaysInSpace > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Days in Space:</span>
              <span className="text-gray-200">{astronaut.totalDaysInSpace}</span>
            </div>
          )}
        </div>
      </div>
    </MagicCard>
  );
};

export default Astronaut;
