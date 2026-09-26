import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Movie } from '../lib/data/catalog';
import { getMovie } from '../lib/data/selectors';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { formatHours } from '../lib/format';
import { Screen } from '../components/Screen';
import { PosterGrid } from '../components/PosterGrid';
import { EmptyState } from '../components/EmptyState';
import { ScalePressable } from '../components/ScalePressable';
import { tap, thump } from '../lib/haptics';

type Segment = 'watchlist' | 'liked' | 'watched' | 'downloads';

const SEGMENTS: { key: Segment; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'watchlist', label: 'My list', icon: 'bookmark-outline' },
  { key: 'liked', label: 'Liked', icon: 'heart-outline' },
  { key: 'watched', label: 'Watched', icon: 'checkmark-circle-outline' },
  { key: 'downloads', label: 'Offline', icon: 'download-outline' },
];

export function LibraryScreen() {
  const { colors, fonts, radius } = useTheme();
  const store = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [segment, setSegment] = useState<Segment>('watchlist');

  const resolve = (ids: string[]): Movie[] =>
    ids.map((id) => getMovie(id)).filter((m): m is Movie => Boolean(m));

  const downloadedIds = useMemo(
    () => Object.keys(store.downloads).filter((id) => (store.downloads[id] ?? 0) >= 100),
    [store.downloads],
  );

  const counts: Record<Segment, number> = {
    watchlist: store.watchlist.length,
    liked: store.liked.length,
    watched: store.watched.length,
    downloads: downloadedIds.length,
  };

  const movies = useMemo(() => {
    if (segment === 'downloads') return resolve(downloadedIds);
    return resolve(store[segment]);
  }, [segment, store.watchlist, store.liked, store.watched, downloadedIds]);

  const totalMinutes = movies.reduce((sum, m) => sum + m.runtime, 0);

  const emptyCopy: Record<Segment, { title: string; message: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
    watchlist: {
      icon: 'bookmark-outline',
      title: 'Your list is empty',
      message: 'Tap the bookmark on any title to save it here for later. Nothing beats a Friday night with a plan.',
    },
    liked: {
      icon: 'heart-outline',
      title: 'No favourites yet',
      message: 'Heart a film and it lands here. Your likes also tune the recommendations on the home shelf.',
    },
    watched: {
      icon: 'checkmark-circle-outline',
      title: 'Nothing watched yet',
      message: 'Press Play on a title and it will be logged here along with your total viewing hours.',
    },
    downloads: {
      icon: 'download-outline',
      title: 'No offline titles',
      message: 'Open a film and tap Download to keep it on this device. Downloads work without a connection.',
    },
  };

  const posterOverlay = (movie: Movie) => (
    <ScalePressable
      scaleTo={0.85}
      onPress={() => {
        thump();
        if (segment === 'downloads') store.cancelDownload(movie.id);
        else store.toggleList(segment, movie.id);
      }}
      style={[
        styles.removeBtn,
        { backgroundColor: 'rgba(8,8,12,0.82)', borderColor: 'rgba(255,255,255,0.22)' },
      ]}
      accessibilityLabel="Remove"
    >
      <Ionicons name={segment === 'downloads' ? 'trash-outline' : 'close'} size={13} color={colors.text} />
    </ScalePressable>
  );

  return (
    <Screen>
      <View style={styles.titleBlock}>
        <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 28 }}>My library</Text>
        <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 13, marginTop: 3 }}>
          {movies.length} {movies.length === 1 ? 'title' : 'titles'}
          {movies.length > 0 ? `  \u00b7  ${formatHours(totalMinutes)} of cinema` : ''}
        </Text>
      </View>

      <View style={[styles.segmentBar, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.md }]}>
        {SEGMENTS.map((s) => {
          const active = segment === s.key;
          return (
            <ScalePressable
              key={s.key}
              scaleTo={0.96}
              onPress={() => {
                tap();
                setSegment(s.key);
              }}
              style={[
                styles.segment,
                {
                  backgroundColor: active ? colors.accentDim : 'transparent',
                  borderRadius: radius.sm,
                  borderColor: active ? colors.accentLine : 'transparent',
                },
              ]}
            >
              <Ionicons
                name={active ? s.icon.replace('-outline', '') as React.ComponentProps<typeof Ionicons>['name'] : s.icon}
                size={15}
                color={active ? colors.accent : colors.textFaint}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: active ? colors.accent : colors.textFaint,
                  fontFamily: active ? fonts.semi : fonts.medium,
                  fontSize: 11.5,
                }}
              >
                {s.label}
              </Text>
              {counts[s.key] > 0 ? (
                <View
                  style={{
                    minWidth: 17,
                    height: 17,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors.accent : colors.surfaceAlt,
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.accentText : colors.textDim,
                      fontFamily: fonts.bold,
                      fontSize: 9.5,
                    }}
                  >
                    {counts[s.key]}
                  </Text>
                </View>
              ) : null}
            </ScalePressable>
          );
        })}
      </View>

      {movies.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <EmptyState
            icon={emptyCopy[segment].icon}
            title={emptyCopy[segment].title}
            message={emptyCopy[segment].message}
            actionLabel="Browse the catalogue"
            onAction={() => navigation.navigate('Tabs', { screen: 'Search' } as never)}
          />
        </ScrollView>
      ) : (
        <PosterGrid
          movies={movies}
          columns={3}
          gap={12}
          keyPrefix={`library-${segment}`}
          renderOverlay={posterOverlay}
          ListHeaderComponent={
            segment === 'downloads' ? (
              <View style={styles.storageNote}>
                <Ionicons name="phone-portrait-outline" size={15} color={colors.accent} />
                <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 12 }}>
                  {`Stored on this device  \u00b7  ${movies.length} of 50 titles`}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 4,
    borderWidth: 1,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderWidth: 1,
  },
  removeBtn: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  storageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
});
