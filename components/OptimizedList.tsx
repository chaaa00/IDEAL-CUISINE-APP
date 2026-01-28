import React, { useCallback, useMemo, useRef, memo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatListProps,
} from 'react-native';
import { getOptimizedFlatListProps, LARGE_LIST_CONFIG } from '@/utils/optimizedList';

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyText?: string;
  emptySubtext?: string;
  itemHeight?: number;
  useLargeListConfig?: boolean;
  loadMoreThreshold?: number;
}

function OptimizedListInner<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isLoadingMore = false,
  onLoadMore,
  onRefresh,
  isRefreshing = false,
  emptyText = 'No items',
  emptySubtext,
  itemHeight,
  useLargeListConfig = false,
  loadMoreThreshold = 0.5,
  ...flatListProps
}: OptimizedListProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const isLoadingMoreRef = useRef(false);

  const optimizedProps = useMemo(
    () => getOptimizedFlatListProps<T>(useLargeListConfig ? LARGE_LIST_CONFIG : undefined),
    [useLargeListConfig]
  );

  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    return (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  const handleRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem]
  );

  const handleEndReached = useCallback(() => {
    if (onLoadMore && !isLoadingMoreRef.current && !isLoadingMore) {
      isLoadingMoreRef.current = true;
      onLoadMore();
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 1000);
    }
  }, [onLoadMore, isLoadingMore]);

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
        {emptySubtext && <Text style={styles.emptySubtext}>{emptySubtext}</Text>}
      </View>
    ),
    [emptyText, emptySubtext]
  );

  const ListFooterComponent = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#000" />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      ) : null,
    [isLoadingMore]
  );

  const refreshControl = useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#000"
        />
      ) : undefined,
    [onRefresh, isRefreshing]
  );

  if (isLoading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={handleRenderItem}
      keyExtractor={keyExtractor}
      {...optimizedProps}
      getItemLayout={getItemLayout}
      onEndReached={handleEndReached}
      onEndReachedThreshold={loadMoreThreshold}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      {...flatListProps}
    />
  );
}

export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

interface OptimizedSectionListProps<T, S> {
  sections: Array<{ title: string; data: T[] }>;
  renderItem: (item: T, index: number, section: { title: string }) => React.ReactElement;
  renderSectionHeader?: (section: { title: string }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  emptyText?: string;
}

export function useMemoizedRenderItem<T>(
  renderFn: (item: T, index: number) => React.ReactElement
) {
  return useCallback(
    ({ item, index }: { item: T; index: number }) => renderFn(item, index),
    [renderFn]
  );
}

export function useStableKeyExtractor<T extends { id: string }>(prefix?: string) {
  return useCallback(
    (item: T) => (prefix ? `${prefix}_${item.id}` : item.id),
    [prefix]
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center' as const,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});

export default OptimizedList;
