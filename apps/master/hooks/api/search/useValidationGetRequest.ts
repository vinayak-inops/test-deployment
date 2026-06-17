import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthToken } from '@repo/ui/hooks/auth/useAuthToken';
import debounce from 'lodash/debounce';

// Get API URL from environment variables with fallbacks
const getApiBaseUrl = () => {
  // First try to get from window (client-side)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Then try to get from process.env (server-side)
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

interface UseValidationGetRequestOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  config?: AxiosRequestConfig;
  requireAuth?: boolean; // New option to specify if auth is required
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError) => void;
  dependencies?: any[];
}

interface UseValidationGetRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: AxiosError | null;
  refetch: () => Promise<void>;
}

// Cache implementation
const requestCache = new Map<string, {
  data: any;
  timestamp: number;
  expiry: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

/**
 * Custom hook for making validation HTTP requests with automatic session management and loading states
 * @param options - Configuration options for the request
 * @returns Object containing data, loading state, error state, and refetch function
 */
export const useValidationGetRequest = <T extends unknown>({
  url,
  method = 'GET',
  data: requestData,
  config = {},
  requireAuth = true,
  onSuccess,
  onError,
  dependencies = []
}: UseValidationGetRequestOptions<T>): UseValidationGetRequestResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AxiosError | null>(null);
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();
  const cacheKey = useRef<string>('');

  // Generate cache key based on request parameters
  const generateCacheKey = useCallback(() => {
    return `${method}:${url}:${JSON.stringify(requestData)}:${token}`;
  }, [method, url, requestData, token]);

  

  const fetchData = useCallback(async (forceFetch = false) => {
    try {
      if (requireAuth && tokenLoading) {
        return;
      }

      if (requireAuth && tokenError) {
        throw new Error(tokenError.message);
      }

      if (requireAuth && !token) {
        throw new Error('No access token available');
      }

      // Check cache first
      const currentCacheKey = generateCacheKey();
      const cachedData = requestCache.get(currentCacheKey);
      
      if (!forceFetch && cachedData && (Date.now() - cachedData.timestamp < cachedData.expiry)) {
        setData(cachedData.data);
        if (onSuccess) {
          onSuccess(cachedData.data);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await axios({
        method,
        url: `${API_BASE_URL}/api/query/attendance/${url}`,
        data: requestData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true,
        ...config,
      });

      const responseData = response.data;
      
      // Update cache
      requestCache.set(currentCacheKey, {
        data: responseData,
        timestamp: Date.now(),
        expiry: CACHE_DURATION
      });

      setData(responseData);

      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (err) {
      const error = err as AxiosError;
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [method, url, requestData, token, tokenLoading, tokenError, config, onSuccess, onError, requireAuth, generateCacheKey]);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce((forceFetch = false) => {
      fetchData(forceFetch);
    }, 300),
    [fetchData]
  );

  useEffect(() => {
    const newCacheKey = generateCacheKey();
    if (newCacheKey !== cacheKey.current) {
      cacheKey.current = newCacheKey;
      debouncedFetch();
    }
    
    return () => {
      debouncedFetch.cancel();
    };
  }, [url, method, JSON.stringify(requestData), token, tokenLoading, tokenError, ...dependencies]);

  // Convert tokenError to AxiosError if it exists
  const combinedError = error || (tokenError ? new AxiosError(tokenError.message) : null);

  return { 
    data, 
    loading: loading || tokenLoading, 
    error: combinedError,
    refetch: async () => {
      await debouncedFetch(true); // Force fetch on manual refetch
    }
  };
};

// Example usage:
/*
const { data, loading, error, refetch } = useValidationGetRequest<any[]>({
  url: 'api/endpoint',
  method: 'GET',
  onSuccess: (data) => {
  },
  onError: (error) => {
  },
  dependencies: [someValue] // Optional: re-fetch when someValue changes
});
*/ 