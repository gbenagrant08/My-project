import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

interface ProgressBarProps {
  progress: number;
  height?: number;
  label?: string;
}

export function ProgressBar({ progress, height = 4, label }: ProgressBarProps) {
  const { colors, fonts, radius } = useTheme();
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View style={styles.wrap}>
      <View
        style={{
          height,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: '100%',
            borderRadius: radius.pill,
            backgroundColor: clamped >= 100 ? colors.success : colors.accent,
          }}
        />
      </View>
      {label ? (
        <Text style={{ color: colors.textFaint, fontFamily: fonts.medium, fontSize: 11 }}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
});
