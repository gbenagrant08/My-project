import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backdropFor } from '../lib/data/artwork';
import { byGenre, sortMovies, topRated, type SortKey } from '../lib/data/selectors';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { Screen } from '../components/Screen';
import { PosterGrid } from '../components/PosterGrid';
import { Chip } from '../components/Chip';
import { RoundIconButton } from '../components/Buttons';
import { EmptyState } from '../components/EmptyState';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rating', label: 'Top rated' },
  { key: 'year', label: 'Newest' },
  { key: 'title', label: 'A\u2013Z' },
  { key: 'runtime', label: 'Longest' },
];

export function GenreScreen() {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Genre'>>();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<SortKey>('rating');

  const genre = route.params?.genre ?? 'Drama';
  const isTrendingShelf = genre === 'Trending';

  const movies = useMemo(() => {
    const base = isTrendingShelf ? topRated(24) : byGenre(genre);
    return sortMovies(base, sort);
  }, [genre, sort, isTrendingShelf]);

  const average = movies.length
    ? movies.reduce((sum, m) => sum + m.rating, 0) / movies.length
    : 0;
  const newest = movies.length ? Math.max(...movies.map((m) => m.year)) : 0;
  const oldest = movies.length ? Math.min(...movies.map((m) => m.year)) : 0;

  return (
    <Screen top={false}>
      <View style={styles.heroWrap}>
        <Image
          source={backdropFor(genre)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(12,12,18,0.55)', 'rgba(12,12,18,0.35)', 'rgba(12,12,18,1)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
          <RoundIconButton icon="chevron-back" variant="glass" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
          <RoundIconButton icon="search" variant="glass" onPress={() => navigation.navigate('Tabs', { screen: 'Search' } as never)} accessibilityLabel="Search" />
        </View>

        <View style={styles.heroBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: colors.accent }} />
            <Text style={{ color: colors.accent, fontFamily: fonts.techMedium, fontSize: 10.5, letterSpacing: 2.4 }}>
              COLLECTION
            </Text>
          </View>
          <Text style={{ color: colors.text, fontFamily: fonts.displayBlack, fontSize: 38, lineHeight: 42 }}>
            {genre}
          </Text>
          <View style={styles.heroStats}>
            <HeroStat icon="film-outline" value={String(movies.length)} label="titles" />
            <HeroStat icon="star-outline" value={average.toFixed(1)} label="avg score" />
            <HeroStat icon="calendar-outline" value={movies.length ? `${oldest}\u2013${newest}` : '\u2014'} label="span" />
          </View>
        </View>
      </View>

      {movies.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <EmptyState
            icon="film-outline"
            title="Nothing here yet"
            message={`The ${genre} shelf is being curated. Check back soon or browse another collection.`}
            actionLabel="Back to home"
            onAction={() => navigation.navigate('Tabs', { screen: 'Home' } as never)}
          />
        </ScrollView>
      ) : (
        <PosterGrid
          movies={movies}
          columns={3}
          gap={12}
          keyPrefix={`genre-${genre}-${sort}`}
          ListHeaderComponent={
            <View style={styles.sortRow}>
              <Ionicons name="swap-vertical-outline" size={14} color={colors.textFaint} />
              {SORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  compact
                  selected={sort === s.key}
                  onPress={() => setSort(s.key)}
                />
              ))}
            </View>
          }
        />
      )}
    </Screen>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={13} color={colors.accent} />
      <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 14 }}>{value}</Text>
      <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { height: 300 },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroBody: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  heroStats: { flexDirection: 'row', gap: 22, marginTop: 14 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexWrap: 'wrap',
  },
});
