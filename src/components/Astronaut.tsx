import React from 'react';
import { Astronaut as AstronautType } from '../types/space.types';
import { useCachedImage } from '../hooks/useCachedImage';

interface AstronautProps {
  astronaut: AstronautType;
}

const Astronaut: React.FC<AstronautProps> = ({ astronaut }) => {
  const cachedImage = useCachedImage(astronaut.profileImageLink || '', {
    metadata: { astronautName: astronaut.name, type: 'profile' }
  });

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'MAINTENANCE': return 'text-caution';
      case 'COMMUNICATION': return 'text-standby';
      case 'WORKING': return 'text-nominal';
      case 'REST': return 'text-offline';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="tactical-panel relative group">
      <div className="p-6">
        {/* Personnel ID Header */}
        <div className="border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-start gap-4">
            {/* Profile Image */}
            <div className="relative w-14 h-14 bg-gray-900 border border-gray-700 overflow-hidden">
              {cachedImage.src && !cachedImage.error ? (
                <img 
                  src={cachedImage.src} 
                  alt={astronaut.name}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 font-mono text-xs ${astronaut.profileImageLink ? 'hidden' : ''}`}>
                <span>{astronaut.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              {/* Status LED */}
              <div className="absolute bottom-0 right-0 p-1 bg-panel">
                <span className="status-led bg-nominal animate-pulse"></span>
              </div>
            </div>
            
            {/* Personnel Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-tactical text-gray-200 uppercase tracking-wider truncate">
                {astronaut.name}
              </h3>
              <div className="text-2xs text-gray-500 mt-2">
                {astronaut.agency} • {astronaut.role || 'MISSION SPECIALIST'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status & Location */}
        <div className="space-y-3 text-2xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 uppercase">STATUS:</span>
            <span className={`font-mono ${getStatusClass(astronaut.taskStatus)}`}>
              {astronaut.taskStatus || 'NOMINAL'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 uppercase">CRAFT:</span>
            <span className="font-mono text-gray-400">
              {astronaut.craft || astronaut.spaceCraft}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 uppercase">MISSION DAY:</span>
            <span className="font-mono text-gray-400">
              {(astronaut.missionDay || 0).toString().padStart(3, '0')}
            </span>
          </div>
        </div>
        
        {/* Vitals Bar */}
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xs text-gray-600">O₂</div>
            <div className="text-sm font-mono text-data mt-1">
              {astronaut.vitals?.o2Sat || 98}%
            </div>
          </div>
          <div className="border-x border-gray-800">
            <div className="text-2xs text-gray-600">BPM</div>
            <div className="text-sm font-mono text-data mt-1">
              {astronaut.vitals?.bpm || 72}
            </div>
          </div>
          <div>
            <div className="text-2xs text-gray-600">TEMP</div>
            <div className="text-sm font-mono text-data mt-1">
              {astronaut.vitals?.temp || 36.8}°
            </div>
          </div>
        </div>
      </div>
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-expanse opacity-50"></div>
    </div>
  );
};

export default Astronaut;
