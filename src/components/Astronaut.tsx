import React from 'react';
import { Astronaut as AstronautType } from '../types/space.types';
import { useCachedImage } from '../hooks/useCachedImage';
import MagicCard from './MagicCard';

interface AstronautProps {
  astronaut: AstronautType;
}

const Astronaut: React.FC<AstronautProps> = ({ astronaut }) => {
  const cachedImage = useCachedImage(astronaut.profileImageLink || '', {
    metadata: { astronautName: astronaut.name, type: 'profile' }
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'MAINTENANCE': return 'text-orange-400 bg-orange-400/20';
      case 'COMMUNICATION': return 'text-blue-400 bg-blue-400/20';
      case 'WORKING': return 'text-green-400 bg-green-400/20';
      case 'REST': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <MagicCard>
      <div className="space-y-4">
        {/* Header with photo and name */}
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="relative p-1 bg-gradient-to-br from-cyan-600/50 to-cyan-800/50">
            <div className="relative bg-slate-950 p-0.5">
              {cachedImage.src && !cachedImage.error ? (
                <img 
                  src={cachedImage.src} 
                  alt={astronaut.name}
                  className="w-14 h-14 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-14 h-14 bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-light text-sm ${astronaut.profileImageLink ? 'hidden' : ''}`}>
                <span>{astronaut.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
            </div>
            {/* Status indicator dot */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 border border-slate-900"></div>
          </div>
          
          {/* Name and info */}
          <div className="flex-1">
            <h3 className="text-base font-medium text-cyan-100 uppercase tracking-wider leading-tight">{astronaut.name}</h3>
            <p className="text-xs text-cyan-600 mt-1 font-light">{astronaut.role || 'Astronaut'}</p>
            <p className="text-xs text-gray-500 font-light">{astronaut.agency}</p>
          </div>
        </div>
        
        {/* Status Row */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-0.5 ${getStatusColor(astronaut.taskStatus)} uppercase tracking-wider`}>
            {astronaut.taskStatus || 'WORKING'}
          </span>
          <div className="flex-1 h-px bg-cyan-800/20"></div>
        </div>
        
        {/* Info Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">Location</div>
              <div className="text-sm text-cyan-100 font-mono">{astronaut.craft || astronaut.spaceCraft}</div>
            </div>
            <div>
              <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">Mission Day</div>
              <div className="text-sm text-cyan-100 font-mono">{astronaut.missionDay || 0}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">Assignment</div>
            <div className="text-sm text-cyan-100 font-light">{astronaut.agencyType || 'Government'}</div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="bg-slate-950/50 -mx-6 -mb-6 px-6 py-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">O₂ SAT</div>
              <div className="text-base font-mono text-cyan-300 font-light">{astronaut.vitals?.o2Sat || 98}%</div>
            </div>
            <div className="text-center border-x border-cyan-800/20">
              <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">BPM</div>
              <div className="text-base font-mono text-cyan-300 font-light">{astronaut.vitals?.bpm || 72}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-cyan-700 uppercase tracking-wider font-light mb-1">TEMP</div>
              <div className="text-base font-mono text-cyan-300 font-light">{astronaut.vitals?.temp || 36.8}°</div>
            </div>
          </div>
        </div>
      </div>
    </MagicCard>
  );
};

export default Astronaut;
