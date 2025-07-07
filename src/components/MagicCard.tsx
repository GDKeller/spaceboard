import React from 'react';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
}

const MagicCard: React.FC<MagicCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-sm p-6 border border-cyan-900/50 hover:border-cyan-700/50 transition-all duration-500 overflow-hidden group ${className}`}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Enhanced corner decorations */}
      <div className="absolute top-0 left-0 w-3 h-3">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/50"></div>
        <div className="absolute top-0 left-0 h-full w-0.5 bg-cyan-500/50"></div>
      </div>
      <div className="absolute top-0 right-0 w-3 h-3">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-cyan-500/50"></div>
        <div className="absolute top-0 right-0 h-full w-0.5 bg-cyan-500/50"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-3 h-3">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500/50"></div>
        <div className="absolute bottom-0 left-0 h-full w-0.5 bg-cyan-500/50"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-3 h-3">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-cyan-500/50"></div>
        <div className="absolute bottom-0 right-0 h-full w-0.5 bg-cyan-500/50"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MagicCard;