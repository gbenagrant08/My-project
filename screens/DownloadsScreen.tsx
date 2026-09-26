import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Movie } from '../lib/data/catalog';
import { posterFor } from '../lib/data/artwork';
import { getMovie } from '../lib/data/selectors';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { formatRuntime } from '../lib/format';
import { Screen } from '../components/Screen';
import { ProgressBar } from '../components/ProgressBar';
import { RoundIconButton } from '../components/Buttons';
import { ScalePressable } from '../components/ScalePressable';
import { EmptyState } from '../components/EmptyState';
import { tap, thump } from '../lib/haptics';

const SIZE_PER_MINUTE_MB = 9.6;

export function DownloadsScreen() {
  const { colors, fonts, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const store = useAppStore();

  const entries = useMemo(() => {
    return Object.entries(store.downloads)
      .map(([id, progress]) => ({ movie: getMovie(id), progress }))
      .filter((e): e is { movie: Movie; progress: number } => Boolean(e.movie))
      .sort((a, b) => a.progress - b.progress);
  }, [store.downloads]);

  const completed = entries.filter((e) => e.progress >= 100);
  const pending = entries.filter((e) => e.progress < 100);
  const usedMb = completed.reduce((sum, e) => sum + e.movie.runtime * SIZE_PER_MINUTE_MB, 0);
  const deviceMb = 128 * 1024;

  return (
    <Screen top={false}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <RoundIconButton icon="chevron-back" variant="solid" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 21 }}>Downloads</Text>
          <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 }}>
            {completed.length} ready offline
            {pending.length > 0 ? `  \u00b7  ${pending.length} in progress` : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}
      >
        <View
          style={[
            styles.storageCard,
            { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.lg },
          ]}
        >
          <View style={styles.storageTop}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accentDim,
              }}
            >
              <Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14 }}>Device storage</Text>
              <Text style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 }}>
                {(usedMb / 1024).toFixed(2)} GB used by Gbena Grant of 128 GB
              </Text>
            </View>
          </View>
          <ProgressBar progress={(usedMb / deviceMb) * 100 * 8} height={6} />
          <View style={styles.storageLegend}>
            <Legend color={colors.accent} label={`Video \u00b7 ${(usedMb / 1024).toFixed(2)} GB`} />
            <Legend color={colors.surfaceAlt} label="Free \u00b7 127 GB" />
          </View>
        </View>

        {entries.length === 0 ? (
          <EmptyState
            icon="cloud-download-outline"
            title="No downloads yet"
            message="Open any title and tap Download to keep it on this device. Perfect for flights and bad network days."
            actionLabel="Find something to watch"
            onAction={() => navigation.navigate('Tabs', { screen: 'Home' } as never)}
          />
        ) : null}

        {pending.length > 0 ? (
          <SectionLabel text={`DOWNLOADING \u00b7 ${pending.length}`} />
        ) : null}
        {pending.map(({ movie, progress }) => (
          <DownloadRow
            key={movie.id}
            movie={movie}
            progress={progress}
            onCancel={() => {
              thump();
              store.cancelDownload(movie.id);
            }}
            onOpen={() => {
              tap();
              navigation.navigate('Movie', { id: movie.id });
            }}
          />
        ))}

        {completed.length > 0 ? (
          <SectionLabel text={`READY TO WATCH \u00b7 ${completed.length}`} />
        ) : null}
        {completed.map(({ movie, progress }) => (
          <DownloadRow
            key={movie.id}
            movie={movie}
            progress={progress}
            onCancel={() => {
              thump();
              store.cancelDownload(movie.id);
            }}
            onOpen={() => {
              tap();
              navigation.navigate('Movie', { id: movie.id });
            }}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text style={{ color: colors.textFaint, fontFamily: fonts.semi, fontSize: 10.5, letterSpacing: 1.8, marginTop: 6 }}>
      {text}
    </Text>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color }} />
      <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function DownloadRow({
  movie,
  progress,
  onCancel,
  onOpen,
}: {
  movie: Movie;
  progress: number;
  onCancel: () => void;
  onOpen: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const done = progress >= 100;
  const sizeMb = movie.runtime * SIZE_PER_MINUTE_MB;

  return (
    <ScalePressable
      scaleTo={0.98}
      onPress={onOpen}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: radius.md },
      ]}
    >
      <View style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Image source={posterFor(movie.id)} style={{ width: 52, height: 78 }} contentFit="cover" transition={200} />
      </View>
      <View style={{ flex: 1, gap: 7 }}>
        <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 14 }}>
          {movie.title}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.textFaint, fontFamily: fonts.regular, fontSize: 11.5 }}>
          {`${movie.year}  \u00b7  ${formatRuntime(movie.runtime)}  \u00b7  ${(sizeMb / 1024).toFixed(2)} GB`}
        </Text>
        {done ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="cloud-done" size={14} color={colors.success} />
            <Text style={{ color: colors.success, fontFamily: fonts.medium, fontSize: 11.5 }}>
              Available offline
            </Text>
          </View>
        ) : (
          <ProgressBar progress={progress} label={`${Math.round(progress)}% \u00b7 ${((sizeMb * progress) / 100 / 1024).toFixed(2)} GB of ${(sizeMb / 1024).toFixed(2)} GB`} />
        )}
      </View>
      <ScalePressable scaleTo={0.85} onPress={onCancel} style={{ padding: 6 }}>
        <Ionicons name={done ? 'trash-outline' : 'close-circle'} size={19} color={colors.textFaint} />
      </ScalePressable>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  storageCard: { borderWidth: 1, padding: 16, gap: 14 },
  storageTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  storageLegend: { flexDirection: 'row', gap: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 12,
    borderWidth: 1,
  },
});
