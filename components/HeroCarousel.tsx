import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Movie } from '../lib/data/catalog';
import { heroFor } from '../lib/data/artwork';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { formatRuntime } from '../lib/format';
import { ScalePressable } from './ScalePressable';
import { IconTextButton, RoundIconButton } from './Buttons';
import { tap, thump } from '../lib/haptics';

interface HeroCarouselProps {
  movies: Movie[];
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const { colors, fonts, radius } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focused = useIsFocused();
  const autoplay = useAppStore().autoplayPreviews;

  const height = Math.round(Math.min(520, Math.max(420, width * 1.18)));
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const listRef = useRef<FlatList<Movie>>(null);

  const goTo = useCallback(
    (next: number) => {
      if (movies.length === 0) return;
      const wrapped = ((next % movies.length) + movies.length) % movies.length;
      indexRef.current = wrapped;
      setIndex(wrapped);
      listRef.current?.scrollToOffset({ offset: wrapped * width, animated: true });
    },
    [movies.length, width],
  );

  useEffect(() => {
    if (!focused || !autoplay || movies.length < 2) return;
    const timer = setInterval(() => goTo(indexRef.current + 1), 5600);
    return () => clearInterval(timer);
  }, [focused, autoplay, goTo, movies.length]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== indexRef.current && next >= 0 && next < movies.length) {
        indexRef.current = next;
        setIndex(next);
      }
    },
    [movies.length, width],
  );

  if (movies.length === 0) return null;

  return (
    <View style={{ height }}>
      <FlatList
        ref={listRef}
        data={movies}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `hero-${item.id}`}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onMomentumScrollEnd={onScroll}
        renderItem={({ item }) => (
          <HeroSlide movie={item} width={width} height={height} />
        )}
      />

      <View style={[styles.dots, { bottom: 18 }]} pointerEvents="none">
        {movies.map((m, i) => (
          <View
            key={m.id}
            style={{
              width: i === index ? 20 : 6,
              height: 6,
              borderRadius: radius.pill,
              backgroundColor: i === index ? colors.accent : 'rgba(255,255,255,0.32)',
            }}
          />
        ))}
      </View>
    </View>
  );

  function HeroSlide({ movie, width: w, height: h }: { movie: Movie; width: number; height: number }) {
    const store = useAppStore();
    const saved = store.watchlist.includes(movie.id);

    return (
      <View style={{ width: w, height: h }}>
        <Image
          source={heroFor(movie.id, movie.genres[0])}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(8,8,12,0.10)', 'rgba(8,8,12,0.55)', 'rgba(8,8,12,0.97)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(8,8,12,0.86)', 'rgba(8,8,12,0)']}
          style={styles.topFade}
        />

        <View style={styles.slideContent}>
          {movie.badge ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.accent,
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: colors.accentText,
                  fontFamily: fonts.bold,
                  fontSize: 10.5,
                  letterSpacing: 1.1,
                }}
              >
                {movie.badge.toUpperCase()}
              </Text>
            </View>
          ) : null}

          <ScalePressable
            scaleTo={0.98}
            onPress={() => {
              tap();
              navigation.navigate('Movie', { id: movie.id });
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                color: colors.text,
                fontFamily: fonts.display,
                fontSize: w > 420 ? 40 : 33,
                lineHeight: w > 420 ? 46 : 38,
                letterSpacing: 0.2,
              }}
            >
              {movie.title}
            </Text>
          </ScalePressable>

          <View style={styles.metaRow}>
            <MetaBit icon="star" text={movie.rating.toFixed(1)} tint={colors.star} />
            <MetaBit icon="calendar" text={String(movie.year)} />
            <MetaBit icon="time" text={formatRuntime(movie.runtime)} />
            <MetaBit icon="film" text={movie.genres.slice(0, 2).join(' / ')} />
          </View>

          <Text
            numberOfLines={2}
            style={{
              color: colors.textDim,
              fontFamily: fonts.light,
              fontSize: 13.5,
              lineHeight: 19,
              fontStyle: 'italic',
              marginTop: 2,
            }}
          >
            {movie.tagline}
          </Text>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <IconTextButton
                icon="play"
                label="Play now"
                flex
                onPress={() => {
                  thump();
                  store.toggleList('watched', movie.id);
                  store.markViewed(movie.id);
                  navigation.navigate('Movie', { id: movie.id });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <IconTextButton
                icon={saved ? 'checkmark' : 'add'}
                label={saved ? 'In my list' : 'My list'}
                variant="ghost"
                flex
                onPress={() => {
                  thump();
                  store.toggleList('watchlist', movie.id);
                }}
              />
            </View>
            <RoundIconButton
              icon="information-circle"
              variant="glass"
              size={46}
              accessibilityLabel="More info"
              onPress={() => navigation.navigate('Movie', { id: movie.id })}
            />
          </View>
        </View>
      </View>
    );
  }
}

function MetaBit({
  icon,
  text,
  tint,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  tint?: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.metaBit}>
      <Ionicons name={icon} size={12} color={tint ?? colors.textFaint} />
      <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 11.5, letterSpacing: 0.3 }}>
        {text.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  dots: { position: 'absolute', left: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  slideContent: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 44,
    gap: 9,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  metaBit: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
});
