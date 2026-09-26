import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeProvider';
import { ratingLabel, ratingTone } from '../lib/format';

interface RatingPillProps {
  rating: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  votes?: string;
}

export function RatingPill({ rating, size = 'sm', showLabel = false, votes }: RatingPillProps) {
  const { colors, fonts, radius } = useTheme();
  const tone = ratingTone(rating);
  const toneColor =
    tone === 'legend'
      ? colors.accent
      : tone === 'great'
        ? colors.success
        : tone === 'good'
          ? colors.star
          : colors.textDim;

  const pad = size === 'sm' ? 6 : 9;
  const iconSize = size === 'sm' ? 11 : 14;
  const fontSize = size === 'sm' ? 12 : 15;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(10,10,14,0.78)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: radius.pill,
        paddingHorizontal: pad + 2,
        paddingVertical: pad - 2,
      }}
    >
      <Ionicons name="star" size={iconSize} color={toneColor} />
      <Text style={{ color: colors.text, fontFamily: fonts.semi, fontSize, letterSpacing: 0.2 }}>
        {rating.toFixed(1)}
      </Text>
      {showLabel && (
        <Text style={{ color: colors.textDim, fontFamily: fonts.regular, fontSize: fontSize - 1 }}>
          {ratingLabel(rating)}
          {votes ? `  ·  ${votes}` : ''}
        </Text>
      )}
    </View>
  );
}
