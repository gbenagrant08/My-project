import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ALL_GENRES, ALL_MOVIES, POPULAR_SEARCHES, searchMovies, sortMovies, type SortKey } from '../lib/data/selectors';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { Screen } from '../components/Screen';
import { SearchBar } from '../components/SearchBar';
import { PosterGrid } from '../components/PosterGrid';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';
import { ScalePressable } from '../components/ScalePressable';
import { tap } from '../lib/haptics';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rating', label: 'Top rated' },
  { key: 'year', label: 'Newest' },
  { key: 'title', label: 'A\u2013Z' },
  { key: 'runtime', label: 'Longest' },
];

export function SearchScreen() {
  const { colors, fonts, radius } = useTheme();
  const store = useAppStore();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState<SortKey>('rating');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setSearching(query.trim().length > 0);
    const timer = setTimeout(() => {
      setDebounced(query.trim());
      setSearching(false);
    }, 260);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const base = debounced.length > 0 ? searchMovies(debounced) : ALL_MOVIES;
    const filtered = genre === 'All' ? base : base.filter((m) => m.genres.includes(genre));
    return sortMovies(filtered, sort);
  }, [debounced, genre, sort]);

  const commitSearch = useCallback(() => {
    if (debounced) store.pushSearch(debounced);
  }, [debounced, store]);

  const isSearching = debounced.length > 0;

  const header = (
    <View>
      <View style={styles.titleBlock}>
        <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 28 }}>Search</Text>
        <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13, marginTop: 3 }}>
          {ALL_MOVIES.length} films across {ALL_GENRES.length} genres
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={commitSearch}
          loading={searching}
          onCancel={() => setQuery('')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ marginBottom: 6 }}
      >
        <Chip label="All" selected={genre === 'All'} compact onPress={() => setGenre('All')} />
        {ALL_GENRES.map((g) => (
          <Chip key={g} label={g} selected={genre === g} compact onPress={() => setGenre(g)} />
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <Ionicons name="funnel-outline" size={14} color={colors.textFaint} />
        {SORTS.map((s) => (
          <ScalePressable
            key={s.key}
            scaleTo={0.94}
            onPress={() => {
              tap();
              setSort(s.key);
            }}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: sort === s.key ? colors.accentDim : 'transparent',
              borderWidth: 1,
              borderColor: sort === s.key ? colors.accentLine : colors.borderSoft,
            }}
          >
            <Text
              style={{
                color: sort === s.key ? colors.accent : colors.textFaint,
                fontFamily: sort === s.key ? fonts.semi : fonts.medium,
                fontSize: 11.5,
              }}
            >
              {s.label}
            </Text>
          </ScalePressable>
        ))}
      </View>

      {!isSearching ? (
        <View style={{ marginBottom: 8 }}>
          {store.searches.length > 0 ? (
            <View style={styles.recentBlock}>
              <View style={styles.recentHead}>
                <Text
                  style={{
                    color: colors.textDim,
                    fontFamily: fonts.semi,
                    fontSize: 11.5,
                    letterSpacing: 1.4,
                  }}
                >
                  RECENT SEARCHES
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    store.clearSearches();
                  }}
                >
                  <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 11.5 }}>
                    Clear
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chipWrap}>
                {store.searches.map((term) => (
                  <ScalePressable
                    key={term}
                    scaleTo={0.94}
                    onPress={() => {
                      tap();
                      setQuery(term);
                    }}
                    style={[styles.historyChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  >
                    <Ionicons name="time-outline" size={12} color={colors.textFaint} />
                    <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 12 }}>{term}</Text>
                    <Pressable
                      hitSlop={6}
                      onPress={() => {
                        tap();
                        store.removeSearch(term);
                      }}
                    >
                      <Ionicons name="close" size={12} color={colors.textFaint} />
                    </Pressable>
                  </ScalePressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.recentBlock}>
            <Text
              style={{
                color: colors.textDim,
                fontFamily: fonts.semi,
                fontSize: 11.5,
                letterSpacing: 1.4,
                marginBottom: 10,
              }}
            >
              POPULAR RIGHT NOW
            </Text>
            <View style={styles.chipWrap}>
              {POPULAR_SEARCHES.map((term) => (
                <ScalePressable
                  key={term}
                  scaleTo={0.94}
                  onPress={() => {
                    tap();
                    setQuery(term);
                  }}
                  style={[styles.historyChip, { borderColor: colors.accentLine, backgroundColor: colors.accentDim }]}
                >
                  <Ionicons name="trending-up-outline" size={12} color={colors.accent} />
                  <Text style={{ color: colors.accent, fontFamily: fonts.medium, fontSize: 12 }}>{term}</Text>
                </ScalePressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 6 }}>
        <SectionHeader
          title={isSearching ? `Results for "${debounced}"` : genre === 'All' ? 'The full library' : genre}
          subtitle={`${results.length} ${results.length === 1 ? 'title' : 'titles'}`}
          accentBar={false}
        />
      </View>
    </View>
  );

  return (
    <Screen>
      {results.length === 0 ? (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            {header}
            <EmptyState
              icon="search-outline"
              title="No titles found"
              message={`Nothing matches "${debounced}"${genre !== 'All' ? ` in ${genre}` : ''}. Try a director, an actor, a year or another genre.`}
              actionLabel="Reset filters"
              onAction={() => {
                setQuery('');
                setDebounced('');
                setGenre('All');
                setSort('rating');
              }}
            />
          </ScrollView>
        </View>
      ) : (
        <PosterGrid
          movies={results}
          columns={3}
          gap={12}
          keyPrefix={`search-${genre}-${sort}`}
          ListHeaderComponent={header}
          onEndReached={commitSearch}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  recentBlock: { paddingHorizontal: 20, paddingTop: 14 },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
});
