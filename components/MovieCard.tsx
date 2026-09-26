import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Movie } from '../lib/data/catalog';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { formatRuntime } from '../lib/format';
import { Poster } from './Poster';
import { ScalePressable } from './ScalePressable';
import { tap } from '../lib/haptics';

interface MovieCardProps {
  movie: Movie;
  width?: number;
  showMeta?: boolean;
  rank?: number;
  trailing?: React.ReactNode;
  onPress?: () => void;
}

export function MovieCard({
  movie,
  width = 132,
  showMeta = true,
  rank,
  trailing,
  onPress,
}: MovieCardProps) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const height = Math.round(width * 1.5);

  return (
    <View style={{ width: rank ? width + 30 : width }}>
      <View style={styles.row}>
        {rank ? (
          <Text
            style={[
              styles.rank,
              {
                color: colors.surfaceAlt,
                fontFamily: fonts.black,
                textShadowColor: colors.accent,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              },
            ]}
          >
            {rank}
          </Text>
        ) : null}
        <ScalePressable
          scaleTo={0.95}
          onPress={() => {
            tap();
            onPress?.();
            navigation.navigate('Movie', { id: movie.id });
          }}
          style={styles.posterShadow}
        >
          <Poster id={movie.id} width={width} height={height}>
            <View style={styles.badgeRow}>
              <View style={styles.ratingTag}>
                <Text style={{ color: colors.star, fontFamily: fonts.bold, fontSize: 11 }}>
                  {'\u2605'} {movie.rating.toFixed(1)}
                </Text>
              </View>
            </View>
            {trailing}
          </Poster>
        </ScalePressable>
      </View>
      {showMeta ? (
        <View style={[styles.meta, rank ? { paddingLeft: 30 } : null]}>
          <Text
            numberOfLines={2}
            style={{ color: colors.text, fontFamily: fonts.semi, fontSize: 13, lineHeight: 17 }}
          >
            {movie.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: colors.textFaint,
              fontFamily: fonts.regular,
              fontSize: 11.5,
              letterSpacing: 0.2,
            }}
          >
            {`${movie.year}  \u00b7  ${formatRuntime(movie.runtime)}  \u00b7  ${movie.genres[0]}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  rank: { fontSize: 58, lineHeight: 60, width: 30, textAlign: 'center', marginRight: -4 },
  posterShadow: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  badgeRow: { position: 'absolute', top: 8, right: 8 },
  ratingTag: {
    backgroundColor: 'rgba(8,8,12,0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  meta: { marginTop: 9, gap: 3 },
});
