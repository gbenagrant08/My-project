import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { posterFor } from '../lib/data/artwork';
import { useTheme } from '../lib/ThemeProvider';

interface PosterProps {
  id: string;
  width: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Poster({ id, width, height, radius = 14, style, children }: PosterProps) {
  const { colors } = useTheme();
  const h = height ?? Math.round(width * 1.5);
  return (
    <View
      style={[
        {
          width,
          height: h,
          borderRadius: radius,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={posterFor(id)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={260}
        cachePolicy="memory-disk"
      />
      {children}
    </View>
  );
}
