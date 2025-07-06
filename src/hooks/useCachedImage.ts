import { useState, useEffect, useRef } from 'react';
import { cacheManager } from '../services/cache/cacheManager';

export interface UseCachedImageOptions {
  fallbackUrl?: string;
  metadata?: Record<string, any>;
}

export const useCachedImage = (originalUrl: string, options: UseCachedImageOptions = {}) => {
  const [cachedUrl, setCachedUrl] = useState<string>(originalUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to track the current request and prevent race conditions
  const currentRequestRef = useRef<string | null>(null);
  const cachedResultsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!originalUrl || originalUrl.trim() === '') {
      setCachedUrl('');
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if we already have a cached result for this URL
    const existingCachedUrl = cachedResultsRef.current.get(originalUrl);
    if (existingCachedUrl) {
      setCachedUrl(existingCachedUrl);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If the originalUrl is already a blob URL or invalid, just use it as-is
    if (originalUrl.startsWith('blob:') || (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://'))) {
      setCachedUrl(originalUrl);
      setIsLoading(false);
      setError(null);
      cachedResultsRef.current.set(originalUrl, originalUrl);
      return;
    }

    let isMounted = true;
    currentRequestRef.current = originalUrl;
    setIsLoading(true);
    setError(null);

    const loadCachedImage = async () => {
      try {
        // Store the URL we're fetching to detect race conditions
        const requestUrl = originalUrl;
        
        // For server-proxied images, use the URL directly without client-side caching
        // The server handles caching and we avoid the blob URL issues
        const url = originalUrl;
        
        // Only update if this is still the current request and component is mounted
        if (isMounted && currentRequestRef.current === requestUrl) {
          setCachedUrl(url);
          setIsLoading(false);
          // Cache the result for this URL
          cachedResultsRef.current.set(originalUrl, url);
        }
      } catch (err) {
        // Only update if this is still the current request and component is mounted
        if (isMounted && currentRequestRef.current === originalUrl) {
          const fallback = options.fallbackUrl || originalUrl;
          setError(err instanceof Error ? err : new Error('Failed to load cached image'));
          setCachedUrl(fallback);
          setIsLoading(false);
          // Cache the fallback result
          cachedResultsRef.current.set(originalUrl, fallback);
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