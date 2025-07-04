import React, { useState } from 'react';

export interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  showStats?: boolean;
  lastUpdate?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  disabled = false,
  className = '',
  showStats = false,
  lastUpdate,
  variant = 'primary',
  size = 'md',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = async () => {
    if (isRefreshing || disabled || isLoading) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshTime(new Date());
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Refresh failed:', error);
      // Could add error toast here
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const baseClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600',
    minimal: 'bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border border-gray-700/50',
  };

  const isDisabled = disabled || isLoading || isRefreshing;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className={`
          ${baseClasses[size]}
          ${variantClasses[variant]}
          font-medium rounded-lg
          transition-all duration-200
          flex items-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95
          ${isRefreshing ? 'animate-pulse' : ''}
        `}
        title="Refresh astronaut data"
      >
        <svg
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>

      {showStats && (
        <div className="text-xs text-gray-500 text-center space-y-1">
          {lastUpdate && (
            <div>
              Last API update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
          {lastRefreshTime && (
            <div>
              Last manual refresh: {formatRelativeTime(lastRefreshTime)}
            </div>
          )}
          {refreshCount > 0 && (
            <div>
              Manual refreshes: {refreshCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface RefreshStatusProps {
  isLoading: boolean;
  lastUpdate?: string;
  error?: Error | null;
  className?: string;
}

export const RefreshStatus: React.FC<RefreshStatusProps> = ({
  isLoading,
  lastUpdate,
  error,
  className = '',
}) => {
  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isLoading) return 'text-blue-400';
    return 'text-green-400';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error.message}`;
    if (isLoading) return 'Loading...';
    if (lastUpdate) {
      const updateTime = new Date(lastUpdate);
      const now = new Date();
      const diffMs = now.getTime() - updateTime.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Updated just now';
      if (diffMins < 60) return `Updated ${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Updated ${diffHours}h ago`;
      
      return `Updated ${updateTime.toLocaleDateString()}`;
    }
    return 'Ready';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        error ? 'bg-red-400' : 
        isLoading ? 'bg-blue-400 animate-pulse' : 
        'bg-green-400'
      }`} />
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
    </div>
  );
};

export interface CacheStatsProps {
  stats?: {
    hitRate: number;
    totalEntries: number;
    totalSize: number;
    lastCleanup: number;
  };
  className?: string;
}

export const CacheStats: React.FC<CacheStatsProps> = ({
  stats,
  className = '',
}) => {
  if (!stats) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatHitRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className={`text-xs text-gray-500 space-y-1 ${className}`}>
      <div className="font-medium text-gray-400">Cache Statistics</div>
      <div className="grid grid-cols-2 gap-2">
        <div>Hit Rate: {formatHitRate(stats.hitRate)}</div>
        <div>Entries: {stats.totalEntries}</div>
        <div>Size: {formatBytes(stats.totalSize)}</div>
        <div>
          Cleanup: {stats.lastCleanup ? 
            new Date(stats.lastCleanup).toLocaleDateString() : 
            'Never'
          }
        </div>
      </div>
    </div>
  );
};

export default RefreshButton;