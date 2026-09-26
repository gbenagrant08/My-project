import React from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Movie } from '../lib/data/catalog';
import { MovieCard } from './MovieCard';

interface PosterGridProps {
  movies: Movie[];
  columns?: number;
  gap?: number;
  horizontalPadding?: number;
  contentStyle?: StyleProp<ViewStyle>;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyPrefix?: string;
  scrollEnabled?: boolean;
  renderOverlay?: (movie: Movie) => React.ReactNode;
}

export function PosterGrid({
  movies,
  columns = 3,
  gap = 12,
  horizontalPadding = 20,
  contentStyle,
  ListHeaderComponent,
  ListFooterComponent,
  onEndReached,
  onRefresh,
  refreshing,
  keyPrefix = 'grid',
  scrollEnabled = true,
  renderOverlay,
}: PosterGridProps) {
  const { width } = useWindowDimensions();
  const cellWidth = Math.floor(
    (Math.min(width, 720) - horizontalPadding * 2 - gap * (columns - 1)) / columns,
  );

  return (
    <FlatList
      data={movies}
      numColumns={columns}
      scrollEnabled={scrollEnabled}
      keyExtractor={(item) => `${keyPrefix}-${item.id}`}
      columnWrapperStyle={columns > 1 ? { gap, paddingHorizontal: horizontalPadding } : undefined}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      onEndReached={movies.length > 6 ? onEndReached : undefined}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={9}
      windowSize={7}
      renderItem={({ item }) => (
        <View style={{ width: cellWidth }}>
          <MovieCard movie={item} width={cellWidth} trailing={renderOverlay?.(item)} />
        </View>
      )}
      ListEmptyComponent={<View style={{ height: 1 }} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48, paddingTop: 4, rowGap: 18 },
});
