import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { Movie } from '../lib/data/catalog';
import { MovieCard } from './MovieCard';
import { SectionHeader } from './SectionHeader';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  ranked?: boolean;
  cardWidth?: number;
  onSeeAll?: () => void;
  ListHeaderComponent?: React.ReactNode;
}

export function MovieRow({
  title,
  subtitle,
  movies,
  ranked = false,
  cardWidth = 132,
  onSeeAll,
}: MovieRowProps) {
  if (movies.length === 0) return null;
  return (
    <View style={styles.block}>
      <SectionHeader title={title} subtitle={subtitle} onAction={onSeeAll} />
      <FlatList
        horizontal
        data={movies}
        keyExtractor={(item) => `${title}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={4}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item, index }) => (
          <MovieCard movie={item} width={cardWidth} rank={ranked ? index + 1 : undefined} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 26 },
  list: { paddingHorizontal: 20, gap: 14 },
});
