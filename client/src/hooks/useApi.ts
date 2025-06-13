import { useState, useEffect, useCallback } from 'react';
import type { LoadingState, ApiResponse, ApiError } from '@/types';

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

interface UseApiResult<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T> | ApiError>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading('loading');
    setError(null);

    try {
      const result = await apiCall();
      
      if (result.success) {
        setData(result.data);
        setLoading('success');
      } else {
        const apiError = result as ApiError;
        setError(apiError.error || 'An error occurred');
        setLoading('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setLoading('error');
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setData(null);
    setLoading('idle');
    setError(null);
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, options.dependencies || []);

  return { data, loading, error, execute, reset };
}

export function useAsyncOperation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}