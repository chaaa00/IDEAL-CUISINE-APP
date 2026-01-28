import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatListProps, ViewToken } from 'react-native';
import React from "react";

export interface VirtualizedListConfig {
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
}

export const DEFAULT_LIST_CONFIG: VirtualizedListConfig = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 5,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
};

export const LARGE_LIST_CONFIG: VirtualizedListConfig = {
  initialNumToRender: 15,
  maxToRenderPerBatch: 10,
  windowSize: 7,
  updateCellsBatchingPeriod: 100,
  removeClippedSubviews: true,
};

export function getOptimizedFlatListProps<T>(
  config: VirtualizedListConfig = DEFAULT_LIST_CONFIG
): Partial<FlatListProps<T>> {
  return {
    initialNumToRender: config.initialNumToRender,
    maxToRenderPerBatch: config.maxToRenderPerBatch,
    windowSize: config.windowSize,
    updateCellsBatchingPeriod: config.updateCellsBatchingPeriod,
    removeClippedSubviews: config.removeClippedSubviews,
    getItemLayout: undefined,
    keyExtractor: (item: any, index: number) => item.id ?? String(index),
  };
}

export function createGetItemLayout<T>(itemHeight: number) {
  return (_data: T[] | null | undefined, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });
}

export interface InfiniteScrollState<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
}

export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ items: T[]; hasMore: boolean }>,
  pageSize: number = 20
) {
  const [state, setState] = useState<InfiniteScrollState<T>>({
    items: [],
    page: 1,
    hasMore: true,
    isLoadingMore: false,
    isRefreshing: false,
  });

  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const { items, hasMore } = await fetchFn(state.page);
      setState(prev => ({
        ...prev,
        items: [...prev.items, ...items],
        page: prev.page + 1,
        hasMore,
        isLoadingMore: false,
      }));
    } catch (error) {
      console.error('[InfiniteScroll] Load more error:', error);
      setState(prev => ({ ...prev, isLoadingMore: false }));
    } finally {
      loadingRef.current = false;
    }
  }, [state.page, state.hasMore, fetchFn]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      const { items, hasMore } = await fetchFn(1);
      setState({
        items,
        page: 2,
        hasMore,
        isLoadingMore: false,
        isRefreshing: false,
      });
    } catch (error) {
      console.error('[InfiniteScroll] Refresh error:', error);
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [fetchFn]);

  const reset = useCallback(() => {
    setState({
      items: [],
      page: 1,
      hasMore: true,
      isLoadingMore: false,
      isRefreshing: false,
    });
  }, []);

  return {
    ...state,
    loadMore,
    refresh,
    reset,
  };
}

export function useViewableItems<T>(
  onViewableItemsChanged?: (items: T[]) => void
) {
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
    }),
    []
  );

  const onViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (onViewableItemsChanged) {
        const items = viewableItems.map(token => token.item as T);
        onViewableItemsChanged(items);
      }
    }
  );

  return {
    viewabilityConfig,
    onViewableItemsChanged: onViewableItemsChangedRef.current,
  };
}

export function useLazyLoad<T>(
  items: T[],
  initialCount: number = 20,
  incrementCount: number = 10
) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + incrementCount, items.length));
  }, [items.length, incrementCount]);

  const hasMore = visibleCount < items.length;

  const reset = useCallback(() => {
    setVisibleCount(initialCount);
  }, [initialCount]);

  return {
    visibleItems,
    loadMore,
    hasMore,
    reset,
    totalCount: items.length,
    visibleCount,
  };
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

export function createListKeyExtractor<T extends { id: string }>(
  prefix?: string
) {
  return (item: T, index: number) =>
    prefix ? `${prefix}_${item.id}` : item.id;
}

export function useListOptimization<T extends { id: string }>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactElement
) {
  const keyExtractor = useCallback((item: T) => item.id, []);

  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem]
  );

  const extraData = useMemo(() => items.map(i => i.id).join(','), [items]);

  return {
    keyExtractor,
    renderItem: memoizedRenderItem,
    extraData,
    ...getOptimizedFlatListProps<T>(),
  };
}
