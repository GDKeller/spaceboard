import React from 'react';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
}

const MagicCard: React.FC<MagicCardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default MagicCard;