import { useState, useEffect } from 'react';
import { cacheManager } from '../services/cache/cacheManager';

export interface UseCachedImageOptions {
  fallbackUrl?: string;
  metadata?: Record<string, any>;
}

export const useCachedImage = (originalUrl: string, options: UseCachedImageOptions = {}) => {
  const [cachedUrl, setCachedUrl] = useState<string>(originalUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!originalUrl || originalUrl.trim() === '') {
      setCachedUrl('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadCachedImage = async () => {
      try {
        // If the originalUrl is already a blob URL or invalid, just use it as-is
        if (originalUrl.startsWith('blob:') || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
          if (isMounted) {
            setCachedUrl(originalUrl);
            setIsLoading(false);
          }
          return;
        }
        
        const url = await cacheManager.fetchAsset(originalUrl, {
          metadata: options.metadata
        });
        
        if (isMounted) {
          setCachedUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load cached image'));
          setCachedUrl(options.fallbackUrl || originalUrl);
          setIsLoading(false);
        }
      }
    };

    loadCachedImage();

    return () => {
      isMounted = false;
    };
  }, [originalUrl, options.fallbackUrl, options.metadata]);

  return {
    src: cachedUrl,
    isLoading,
    error,
    originalUrl
  };
};