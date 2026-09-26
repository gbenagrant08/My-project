import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Movie } from '../lib/data/catalog';
import {
  ALL_GENRES,
  byGenre,
  classics,
  genreCounts,
  nollywood,
  recentReleases,
  topRated,
  trending,
  getMovie,
} from '../lib/data/selectors';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { Screen } from '../components/Screen';
import { AppHeader } from '../components/AppHeader';
import { HeroCarousel } from '../components/HeroCarousel';
import { MovieRow } from '../components/MovieRow';
import { Chip } from '../components/Chip';
import { GenreCard } from '../components/GenreCard';
import { SectionHeader } from '../components/SectionHeader';

interface Section {
  key: string;
  title: string;
  subtitle?: string;
  movies: Movie[];
  ranked?: boolean;
  genre?: string;
}

const HERO_IDS = ['dune-two', 'oppenheimer', 'parasite', 'jagun-jagun', 'inception', 'lionheart'];

export function HomeScreen() {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const store = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [seed, setSeed] = useState(0);

  const heroes = useMemo(() => {
    const picked = HERO_IDS.map((id) => getMovie(id)).filter((m): m is Movie => Boolean(m));
    return picked.length > 0 ? picked : trending().slice(0, 5);
  }, []);

  const recentMovies = useMemo(
    () => store.recent.map((id) => getMovie(id)).filter((m): m is Movie => Boolean(m)).slice(0, 12),
    [store.recent],
  );

  const awardWinners = useMemo(
    () =>
      [...topRated(50)].filter((m) =>
        /oscar|best picture|palme|big five|masterpiece/i.test(m.badge),
      ),
    [],
  );

  const sections = useMemo<Section[]>(() => {
    const rotate = <T,>(list: T[], by: number): T[] => {
      if (list.length === 0 || by === 0) return list;
      const offset = by % list.length;
      return [...list.slice(offset), ...list.slice(0, offset)];
    };

    const out: Section[] = [];

    if (recentMovies.length > 0) {
      out.push({
        key: 'recent',
        title: 'Pick up where you left off',
        subtitle: 'Recently opened on this device',
        movies: recentMovies,
      });
    }

    out.push({
      key: 'trending',
      title: 'Trending this week',
      subtitle: 'What Nigeria is watching right now',
      movies: rotate(trending(), seed),
      genre: 'Trending',
    });

    out.push({
      key: 'top10',
      title: 'Top 10 today',
      subtitle: 'Ranked by audience score',
      movies: topRated(10),
      ranked: true,
    });

    out.push({
      key: 'nollywood',
      title: 'Nollywood spotlight',
      subtitle: 'Homegrown stories, world-class craft',
      movies: rotate(nollywood(), seed),
      genre: 'Nollywood',
    });

    out.push({
      key: 'awards',
      title: 'Award winners',
      subtitle: 'Academy honoured cinema',
      movies: awardWinners,
    });

    out.push({
      key: 'scifi',
      title: 'Mind-bending sci-fi',
      movies: byGenre('Sci-Fi'),
      genre: 'Sci-Fi',
    });

    out.push({
      key: 'new',
      title: 'Fresh releases',
      subtitle: 'The last decade of cinema',
      movies: rotate(recentReleases(), seed),
    });

    out.push({
      key: 'action',
      title: 'Action & adventure',
      movies: [...byGenre('Action'), ...byGenre('Adventure')].filter(
        (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i,
      ),
      genre: 'Action',
    });

    out.push({
      key: 'classics',
      title: 'The golden age',
      subtitle: 'Pre-2000 essentials',
      movies: classics(),
    });

    return out;
  }, [awardWinners, recentMovies, seed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setSeed((s) => s + 3);
      setRefreshing(false);
    }, 750);
  }, []);

  const counts = useMemo(() => genreCounts(), []);
  const genreCardWidth = Math.floor((Math.min(width, 720) - 40 - 12) / 2);

  const header = (
    <View>
      <AppHeader />
      <HeroCarousel movies={heroes} />

      <View style={styles.quickRow}>
        <View style={styles.stat}>
          <Ionicons name="film-outline" size={15} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.textDim, fontFamily: fonts.medium }]}>
            {counts.reduce((sum, c) => sum + c.count, 0)} curated titles
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="cloud-offline-outline" size={15} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.textDim, fontFamily: fonts.medium }]}>
            Works offline
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={{ marginBottom: 24 }}
      >
        {ALL_GENRES.map((genre) => (
          <Chip
            key={genre}
            label={genre}
            compact
            onPress={() => navigation.navigate('Genre', { genre })}
          />
        ))}
      </ScrollView>

      <SectionHeader
        title="Browse by genre"
        subtitle="Every shelf in the library"
        accentBar
      />
      <View style={styles.genreGrid}>
        {counts.map((entry) => (
          <GenreCard
            key={entry.genre}
            genre={entry.genre}
            count={entry.count}
            width={genreCardWidth}
          />
        ))}
      </View>
      <View style={{ height: 26 }} />
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item }: ListRenderItemInfo<Section>) => (
          <MovieRow
            title={item.title}
            subtitle={item.subtitle}
            movies={item.movies}
            ranked={item.ranked}
            onSeeAll={
              item.genre ? () => navigation.navigate('Genre', { genre: item.genre as string }) : undefined
            }
          />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={3}
        windowSize={9}
        maxToRenderPerBatch={4}
        removeClippedSubviews
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={{ color: colors.textFaint, fontFamily: fonts.techMedium, fontSize: 10, letterSpacing: 2 }}>
              {'GBENA GRANT  \u00b7  v1.0.0'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 24 },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 11.5, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 12 },
  chips: { paddingHorizontal: 20, gap: 8 },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  footer: { alignItems: 'center', paddingTop: 10, paddingBottom: 26 },
});
