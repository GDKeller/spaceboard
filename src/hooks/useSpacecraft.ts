import { useState, useEffect } from 'react';
import { SpacecraftData, LoadingState } from '../types/space.types';
import { spaceService } from '../services/api/spaceService';

export const useSpacecraft = () => {
  const [data, setData] = useState<SpacecraftData | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  const fetchSpacecraft = async () => {
    try {
      setLoadingState({ isLoading: true, error: null });
      const spacecraftData = await spaceService.getCachedSpacecraft();
      setData(spacecraftData);
      setLoadingState({ isLoading: false, error: null });
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error as any,
      });
    }
  };

  const refetch = () => {
    spaceService.clearCache();
    fetchSpacecraft();
  };

  useEffect(() => {
    fetchSpacecraft();
  }, []);

  return {
    data,
    isLoading: loadingState.isLoading,
    error: loadingState.error,
    refetch,
  };
};