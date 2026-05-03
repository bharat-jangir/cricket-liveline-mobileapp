import { useState, useCallback, useEffect, useRef } from 'react';

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedData<T> {
  result: T[];
  pagination: PaginationMetadata;
}

interface UsePaginationOptions {
  limit?: number;
  initialParams?: any;
}

export function usePagination<T>(
  fetchFn: (params: any) => Promise<PaginatedData<T> | T[]>,
  deps: any[] = [],
  options: UsePaginationOptions = {}
) {
  const { limit = 10, initialParams = {} } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (targetPage: number, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (targetPage > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const params = { ...initialParams, page: targetPage, limit };
      const response = await fetchFnRef.current(params);

      let newItems: T[] = [];
      let pagination: PaginationMetadata | null = null;

      if (Array.isArray(response)) {
        newItems = response;
        // If it's just an array, we can't really know if there's more,
        // but we can guess based on the limit
        setHasMore(newItems.length >= limit);
      } else if (response && response.result) {
        newItems = response.result;
        pagination = response.pagination;
        setHasMore(pagination.page < pagination.totalPages);
      }

      setItems(prev => (isRefreshing || targetPage === 1 ? newItems : [...prev, ...newItems]));
      setPage(targetPage);
    } catch (err: any) {
      console.error('[usePagination] Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [initialParams, limit]);

  // Initial fetch and reset when deps change
  useEffect(() => {
    fetchData(1, true);
  }, deps);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchData(page + 1);
    }
  }, [loading, loadingMore, hasMore, page, fetchData]);

  const refresh = useCallback(() => {
    fetchData(1, true);
  }, [fetchData]);

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    setItems,
  };
}
