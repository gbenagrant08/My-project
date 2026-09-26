import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { useTheme } from '../lib/ThemeProvider';
import { tap } from '../lib/haptics';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function Chip({ label, selected = false, onPress, compact = false }: ChipProps) {
  const { colors, fonts, radius } = useTheme();
  return (
    <ScalePressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      scaleTo={0.94}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 7 : 9,
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          color: selected ? colors.accentText : colors.textDim,
          fontFamily: selected ? fonts.semi : fonts.medium,
          fontSize: compact ? 12 : 13,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
