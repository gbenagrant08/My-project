import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeProvider';
import { ScalePressable } from './ScalePressable';
import { tap } from '../lib/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface RoundIconButtonProps {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  variant?: 'glass' | 'solid' | 'accent' | 'outline';
  active?: boolean;
  accessibilityLabel?: string;
}

export function RoundIconButton({
  icon,
  onPress,
  size = 40,
  variant = 'glass',
  active = false,
  accessibilityLabel,
}: RoundIconButtonProps) {
  const { colors, radius } = useTheme();

  const background =
    variant === 'accent'
      ? colors.accent
      : variant === 'solid'
        ? colors.surfaceAlt
        : variant === 'outline'
          ? 'transparent'
          : 'rgba(12,12,18,0.62)';

  const tint =
    variant === 'accent'
      ? colors.accentText
      : active
        ? colors.accent
        : variant === 'outline'
          ? colors.textDim
          : colors.text;

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      scaleTo={0.9}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: background,
          borderColor:
            variant === 'glass'
              ? 'rgba(255,255,255,0.16)'
              : variant === 'outline'
                ? colors.border
                : 'transparent',
        },
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={tint} />
    </ScalePressable>
  );
}

interface IconTextButtonProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  flex?: boolean;
}

export function IconTextButton({ icon, label, onPress, variant = 'primary', flex }: IconTextButtonProps) {
  const { colors, fonts, radius } = useTheme();
  const primary = variant === 'primary';
  return (
    <ScalePressable
      scaleTo={0.96}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        styles.pill,
        {
          borderRadius: radius.pill,
          backgroundColor: primary ? colors.accent : 'rgba(255,255,255,0.07)',
          borderColor: primary ? colors.accent : 'rgba(255,255,255,0.16)',
          flex: flex ? 1 : undefined,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={primary ? colors.accentText : colors.text}
      />
      <Text
        numberOfLines={1}
        style={{
          color: primary ? colors.accentText : colors.text,
          fontFamily: primary ? fonts.bold : fonts.semi,
          fontSize: 14,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

interface ActionTileProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
  active?: boolean;
}

export function ActionTile({ icon, label, onPress, active }: ActionTileProps) {
  const { colors, fonts, radius } = useTheme();
  return (
    <ScalePressable
      scaleTo={0.93}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        styles.tile,
        {
          borderRadius: radius.md,
          backgroundColor: active ? colors.accentDim : colors.surface,
          borderColor: active ? colors.accentLine : colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={19} color={active ? colors.accent : colors.textDim} />
      <Text
        numberOfLines={1}
        style={{
          color: active ? colors.accent : colors.textDim,
          fontFamily: active ? fonts.semi : fonts.medium,
          fontSize: 11.5,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
  },
});
