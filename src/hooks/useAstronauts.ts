import { useState, useEffect } from 'react';
import { SpaceData, LoadingState } from '../types/space.types';
import { spaceService } from '../services/api/spaceService';

export const useAstronauts = () => {
  const [data, setData] = useState<SpaceData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  const fetchAstronauts = async () => {
    try {
      setLoadingState({ isLoading: true, error: null });
      const astronautData = await spaceService.getCachedAstronauts();
      setData(astronautData);
      setLoadingState({ isLoading: false, error: null });
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error as any,
      });
    }
  };

  const refetch = async () => {
    await spaceService.clearCache();
    fetchAstronauts();
  };

  useEffect(() => {
    fetchAstronauts();
  }, []);

  return {
    data,
    isLoading: loadingState.isLoading,
    error: loadingState.error,
    refetch,
  };
};