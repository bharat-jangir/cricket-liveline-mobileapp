import { useState, useCallback } from 'react';

export function useFetch<T>(fetchFn: (...args: any[]) => Promise<T>, initialData: T | null = null) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  return { data, loading, error, execute, setData };
}
