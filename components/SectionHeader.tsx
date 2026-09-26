import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeProvider';
import { ScalePressable } from './ScalePressable';
import { tap } from '../lib/haptics';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentBar?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel = 'See all',
  onAction,
  accentBar = true,
}: SectionHeaderProps) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.titleWrap}>
          {accentBar && (
            <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: colors.accent }} />
          )}
          <Text numberOfLines={1} style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textFaint, fontFamily: fonts.regular }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onAction ? (
        <ScalePressable
          scaleTo={0.92}
          onPress={() => {
            tap();
            onAction();
          }}
          style={styles.action}
        >
          <Text style={{ color: colors.accent, fontFamily: fonts.semi, fontSize: 12.5, letterSpacing: 0.4 }}>
            {actionLabel.toUpperCase()}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </ScalePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  left: { flex: 1, gap: 3 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { fontSize: 19, letterSpacing: 0.1 },
  subtitle: { fontSize: 12, marginLeft: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
});
