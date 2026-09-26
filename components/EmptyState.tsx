import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeProvider';
import { ScalePressable } from './ScalePressable';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconRing,
          { borderRadius: radius.pill, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Ionicons name={icon} size={30} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textFaint, fontFamily: fonts.regular }]}>{message}</Text>
      {actionLabel && onAction ? (
        <ScalePressable
          scaleTo={0.95}
          onPress={onAction}
          style={[
            styles.button,
            { backgroundColor: colors.accent, borderRadius: radius.pill },
          ]}
        >
          <Text style={{ color: colors.accentText, fontFamily: fonts.bold, fontSize: 14 }}>{actionLabel}</Text>
        </ScalePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingVertical: 56, gap: 10 },
  iconRing: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 6 },
  title: { fontSize: 20, textAlign: 'center' },
  message: { fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  button: { paddingHorizontal: 22, paddingVertical: 12, marginTop: 10 },
});
