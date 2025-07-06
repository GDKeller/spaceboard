import { useState, useEffect } from 'react';

interface ISSData {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: 'daylight' | 'eclipsed';
  footprint: number;
  timestamp: number;
  daynum: number;
  solar_lat: number;
  solar_lon: number;
  units: string;
}

interface UseISSResult {
  data: ISSData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useISS(): UseISSResult {
  const [data, setData] = useState<ISSData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchISS = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:4108/api/iss/now');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const issData: ISSData = await response.json();
      setData(issData);
    } catch (err) {
      console.error('Error fetching ISS data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchISS();
    
    // Update every 1 second for real-time tracking
    const interval = setInterval(fetchISS, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchISS,
  };
}