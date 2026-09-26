import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { backdropFor } from '../lib/data/artwork';
import { useTheme } from '../lib/ThemeProvider';
import { ScalePressable } from './ScalePressable';
import { tap } from '../lib/haptics';

interface GenreCardProps {
  genre: string;
  count: number;
  width: number;
  height?: number;
}

export function GenreCard({ genre, count, width, height = 96 }: GenreCardProps) {
  const { colors, fonts, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScalePressable
      scaleTo={0.96}
      onPress={() => {
        tap();
        navigation.navigate('Genre', { genre });
      }}
      style={{
        width,
        height,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.surfaceAlt,
      }}
    >
      <Image
        source={backdropFor(genre)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={240}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(8,8,12,0.25)', 'rgba(8,8,12,0.9)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 15.5 }}>
            {genre}
          </Text>
          <Text style={{ color: colors.textDim, fontFamily: fonts.regular, fontSize: 11.5, marginTop: 2 }}>
            {count} {count === 1 ? 'title' : 'titles'}
          </Text>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.10)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Ionicons name="chevron-forward" size={15} color={colors.text} />
        </View>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
});
