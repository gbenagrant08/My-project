import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Movie } from '../lib/data/catalog';
import { heroFor, posterFor } from '../lib/data/artwork';
import { getMovieOrFirst, similarTo } from '../lib/data/selectors';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { formatRuntime, initials as toInitials, ratingLabel } from '../lib/format';
import { MovieCard } from '../components/MovieCard';
import { RatingPill } from '../components/RatingPill';
import { SectionHeader } from '../components/SectionHeader';
import { ActionTile, IconTextButton, RoundIconButton } from '../components/Buttons';
import { ProgressBar } from '../components/ProgressBar';
import { ScalePressable } from '../components/ScalePressable';
import { thump, tap, success } from '../lib/haptics';

export function MovieDetailScreen() {
  const { colors, fonts, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Movie'>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useAppStore();

  const movie = getMovieOrFirst(route.params?.id ?? '');
  const [expanded, setExpanded] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  const saved = store.watchlist.includes(movie.id);
  const liked = store.liked.includes(movie.id);
  const watched = store.watched.includes(movie.id);
  const progress = store.downloads[movie.id];
  const downloading = progress !== undefined && progress < 100;
  const downloaded = progress === 100;

  useEffect(() => {
    store.markViewed(movie.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.id]);

  const similar = useMemo(() => similarTo(movie, 10), [movie]);
  const heroHeight = Math.round(Math.min(340, Math.max(250, width * 0.72)));

  const openPlayer = () => {
    thump();
    if (!store.watched.includes(movie.id)) store.toggleList('watched', movie.id);
    setPlayerOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ---------------- hero ---------------- */}
        <View style={{ height: heroHeight }}>
          <Image
            source={heroFor(movie.id, movie.genres[0])}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={320}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(12,12,18,0.72)', 'rgba(12,12,18,0.05)', 'rgba(12,12,18,1)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
            <RoundIconButton icon="chevron-back" variant="glass" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <RoundIconButton icon="share-social-outline" variant="glass" onPress={() => tap()} accessibilityLabel="Share" />
              <RoundIconButton
                icon={liked ? 'heart' : 'heart-outline'}
                variant="glass"
                active={liked}
                onPress={() => {
                  thump();
                  store.toggleList('liked', movie.id);
                }}
                accessibilityLabel="Like"
              />
            </View>
          </View>
        </View>

        {/* ---------------- title block ---------------- */}
        <View style={styles.titleRow}>
          <View
            style={{
              borderRadius: radius.md,
              overflow: 'hidden',
              marginTop: -74,
              borderWidth: 2,
              borderColor: colors.bg,
              shadowColor: '#000',
              shadowOpacity: 0.6,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}
          >
            <Image
              source={posterFor(movie.id)}
              style={{ width: 108, height: 162 }}
              contentFit="cover"
              transition={260}
            />
          </View>

          <View style={{ flex: 1, gap: 8 }}>
            {movie.badge ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.accentDim,
                  borderColor: colors.accentLine,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 1 }}>
                  {movie.badge.toUpperCase()}
                </Text>
              </View>
            ) : null}
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 25, lineHeight: 30 }}>
              {movie.title}
            </Text>
            <View style={styles.metaRow}>
              <RatingPill rating={movie.rating} size="sm" />
              <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 12 }}>
                {`${movie.year}  \u00b7  ${formatRuntime(movie.runtime)}`}
              </Text>
            </View>
            <View style={styles.genreRow}>
              {movie.genres.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    tap();
                    navigation.navigate('Genre', { genre: g });
                  }}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.pill,
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ color: colors.textDim, fontFamily: fonts.medium, fontSize: 11 }}>{g}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- actions ---------------- */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1.6 }}>
            <IconTextButton icon={watched ? 'refresh' : 'play'} label={watched ? 'Watch again' : 'Play now'} flex onPress={openPlayer} />
          </View>
          <View style={{ flex: 1.4 }}>
            <IconTextButton
              icon={saved ? 'checkmark' : 'add'}
              label={saved ? 'Saved' : 'My list'}
              variant="ghost"
              flex
              onPress={() => {
                thump();
                store.toggleList('watchlist', movie.id);
              }}
            />
          </View>
        </View>

        <View style={styles.tiles}>
          <ActionTile
            icon={liked ? 'heart' : 'heart-outline'}
            label={liked ? 'Liked' : 'Like'}
            active={liked}
            onPress={() => {
              thump();
              store.toggleList('liked', movie.id);
            }}
          />
          <ActionTile
            icon={downloaded ? 'cloud-done' : downloading ? 'cloud-download' : 'download-outline'}
            label={downloaded ? 'Offline' : downloading ? `${Math.round(progress ?? 0)}%` : 'Download'}
            active={downloaded}
            onPress={() => {
              if (downloaded) {
                store.cancelDownload(movie.id);
              } else {
                thump();
                store.startDownload(movie.id);
              }
            }}
          />
          <ActionTile
            icon={watched ? 'checkmark-circle' : 'eye-outline'}
            label={watched ? 'Watched' : 'Mark seen'}
            active={watched}
            onPress={() => {
              success();
              store.toggleList('watched', movie.id);
            }}
          />
          <ActionTile icon="share-social-outline" label="Share" onPress={() => tap()} />
        </View>

        {downloading ? (
          <View style={styles.downloadBar}>
            <ProgressBar progress={progress ?? 0} label={`Downloading \u00b7 ${Math.round(progress ?? 0)}% \u00b7 1.4 GB`} />
            <Pressable hitSlop={8} onPress={() => store.cancelDownload(movie.id)}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          </View>
        ) : null}

        {/* ---------------- synopsis ---------------- */}
        <View style={styles.section}>
          <Text style={{ color: colors.accent, fontFamily: fonts.displayMedium, fontSize: 16, fontStyle: 'italic', lineHeight: 22 }}>
            {`\u201c${movie.tagline}\u201d`}
          </Text>
          <Text
            numberOfLines={expanded ? undefined : 3}
            style={{ color: colors.textDim, fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 22, marginTop: 12 }}
          >
            {movie.synopsis}
          </Text>
          <Pressable hitSlop={6} onPress={() => setExpanded((v) => !v)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={{ color: colors.accent, fontFamily: fonts.semi, fontSize: 12.5 }}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </Pressable>
        </View>

        {/* ---------------- facts ---------------- */}
        <View style={[styles.facts, { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg }]}>
          <Fact label="Director" value={movie.director} icon="megaphone-outline" />
          <Fact label="Audience score" value={`${movie.rating.toFixed(1)} / 10  \u00b7  ${ratingLabel(movie.rating)}`} icon="star-outline" />
          <Fact label="Votes" value={movie.votes} icon="people-outline" />
          <Fact label="Runtime" value={`${formatRuntime(movie.runtime)} (${movie.runtime} min)`} icon="time-outline" />
          <Fact label="Released" value={String(movie.year)} icon="calendar-outline" />
          <Fact label="Genres" value={movie.genres.join(', ')} icon="pricetags-outline" last />
        </View>

        {/* ---------------- cast ---------------- */}
        <View style={{ marginTop: 26 }}>
          <SectionHeader title="Principal cast" subtitle={`${movie.cast.length} credited`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
            {movie.cast.map((name) => (
              <View key={name} style={styles.castItem}>
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1.5,
                    borderColor: colors.accentLine,
                  }}
                >
                  <Text style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: 18 }}>
                    {toInitials(name)}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    color: colors.text,
                    fontFamily: fonts.medium,
                    fontSize: 11.5,
                    textAlign: 'center',
                    marginTop: 7,
                    lineHeight: 15,
                  }}
                >
                  {name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ---------------- similar ---------------- */}
        <View style={{ marginTop: 26 }}>
          <SectionHeader title="More like this" subtitle={`Because you opened ${movie.title}`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
            {similar.map((m) => (
              <MovieCard key={m.id} movie={m} width={124} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <PlayerModal
        visible={playerOpen}
        movie={movie}
        onClose={() => setPlayerOpen(false)}
      />
    </View>
  );
}

function Fact({
  label,
  value,
  icon,
  last,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View
      style={[
        styles.factRow,
        !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft } : null,
      ]}
    >
      <View style={styles.factLabel}>
        <Ionicons name={icon} size={14} color={colors.textFaint} />
        <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 12.5 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 13, flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

function PlayerModal({ visible, movie, onClose }: { visible: boolean; movie: Movie; onClose: () => void }) {
  const { colors, fonts, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(true);
  const total = movie.runtime * 60;

  useEffect(() => {
    if (!visible) {
      setPosition(0);
      setPlaying(true);
      return;
    }
    if (!playing) return;
    const id = setInterval(() => {
      setPosition((p) => (p + 45 >= total ? total : p + 45));
    }, 250);
    return () => clearInterval(id);
  }, [visible, playing, total]);

  const finished = position >= total;

  useEffect(() => {
    if (finished && playing) setPlaying(false);
  }, [finished, playing]);

  const clock = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const pct = Math.min(100, (position / total) * 100);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.player, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 }]}>
        <Image
          source={heroFor(movie.id, movie.genres[0])}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={26}
        />
        <View style={styles.playerDim} />

        <View style={styles.playerTop}>
          <RoundIconButton icon="close" variant="glass" onPress={onClose} accessibilityLabel="Close player" />
          <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14, flex: 1, textAlign: 'center', marginHorizontal: 10 }}>
            {movie.title}
          </Text>
          <RoundIconButton icon="ellipsis-horizontal" variant="glass" onPress={() => tap()} accessibilityLabel="More" />
        </View>

        <View style={styles.playerCenter}>
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderWidth: 1.5,
              borderColor: colors.accentLine,
            }}
          >
            <Ionicons name={finished ? 'checkmark' : playing ? 'pause' : 'play'} size={34} color={colors.accent} />
          </View>
          <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 22, marginTop: 18, textAlign: 'center', paddingHorizontal: 24 }}>
            {finished ? 'Finished' : 'Now playing'}
          </Text>
          <Text style={{ color: colors.textDim, fontFamily: fonts.light, fontSize: 13, marginTop: 6, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 30 }}>
            {movie.tagline}
          </Text>
        </View>

        <View style={styles.playerBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: colors.textDim, fontFamily: fonts.techMedium, fontSize: 11 }}>{clock(position)}</Text>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={pct} height={4} />
            </View>
            <Text style={{ color: colors.textDim, fontFamily: fonts.techMedium, fontSize: 11 }}>
              -{clock(Math.max(0, total - position))}
            </Text>
          </View>

          <View style={styles.playerControls}>
            <ScalePressable
              scaleTo={0.88}
              onPress={() => setPosition((p) => Math.max(0, p - 300))}
              style={styles.controlSmall}
            >
              <Ionicons name="play-back" size={22} color={colors.text} />
            </ScalePressable>
            <ScalePressable
              scaleTo={0.9}
              onPress={() => {
                tap();
                setPlaying((p) => !p);
              }}
              style={[styles.controlBig, { backgroundColor: colors.accent, borderRadius: radius.pill }]}
            >
              <Ionicons name={playing ? 'pause' : 'play'} size={30} color={colors.accentText} />
            </ScalePressable>
            <ScalePressable
              scaleTo={0.88}
              onPress={() => setPosition((p) => Math.min(total, p + 300))}
              style={styles.controlSmall}
            >
              <Ionicons name="play-forward" size={22} color={colors.text} />
            </ScalePressable>
          </View>

          <Pressable
            onPress={() => {
              success();
              onClose();
            }}
            style={[styles.finishBtn, { borderColor: colors.border, borderRadius: radius.pill }]}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
            <Text style={{ color: colors.textDim, fontFamily: fonts.semi, fontSize: 12.5 }}>
              {finished ? 'Marked as watched \u00b7 close' : 'Skip to end & mark watched'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16, marginTop: -34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 22 },
  tiles: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12 },
  downloadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
  },
  section: { paddingHorizontal: 20, marginTop: 26 },
  facts: { marginHorizontal: 20, marginTop: 24, borderWidth: 1, paddingHorizontal: 16 },
  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, gap: 12 },
  factLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  castRow: { paddingHorizontal: 20, gap: 18 },
  castItem: { width: 74 },
  similarRow: { paddingHorizontal: 20, gap: 14 },
  player: { flex: 1, backgroundColor: '#05050A' },
  playerDim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,4,8,0.82)' },
  playerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  playerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playerBottom: { paddingHorizontal: 24, gap: 22 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34 },
  controlSmall: { padding: 8 },
  controlBig: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
  },
});
