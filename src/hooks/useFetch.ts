import { useState, useEffect, useCallback, useRef } from 'react';

// Overloaded useFetch:
// - useFetch(fetchFn, deps: any[])  → auto-executes when deps change (loading starts true)
// - useFetch(fetchFn, null)         → manual execution via execute()
export function useFetch<T>(
  fetchFn: (...args: any[]) => Promise<T>,
  depsOrInitial: any[] | T | null = null
) {
  const isAutoMode = Array.isArray(depsOrInitial);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(isAutoMode);
  const [error, setError] = useState<Error | null>(null);

  // Synchronous state reset when dependencies change in auto-mode
  const lastDeps = useRef<any[] | null>(null);
  const currentDeps = isAutoMode ? (depsOrInitial as any[]) : null;

  if (isAutoMode && lastDeps.current !== null) {
      const changed = currentDeps!.some((dep, i) => dep !== lastDeps.current![i]);
      if (changed) {
          lastDeps.current = currentDeps;
          setData(null);
          setLoading(true);
      }
  } else if (isAutoMode) {
      lastDeps.current = currentDeps;
  }

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current(...args);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // If second arg is an array, treat as deps and auto-execute
  useEffect(() => {
    if (isAutoMode) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, isAutoMode ? (depsOrInitial as any[]) : []);

  return { data, loading, error, execute, setData };
}
