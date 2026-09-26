import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../lib/ThemeProvider';
import { useAppStore } from '../lib/store/AppStore';
import { RoundIconButton } from './Buttons';
import { ScalePressable } from './ScalePressable';

export function BrandMark({ size = 34 }: { size?: number }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.accentText,
          fontFamily: fonts.tech,
          fontSize: size * 0.5,
          lineHeight: size * 0.62,
        }}
      >
        G
      </Text>
    </View>
  );
}

export function AppHeader() {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const downloads = useAppStore().downloads;
  const pending = Object.values(downloads).filter((p) => p < 100).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <BrandMark />
        <View>
          <Text style={{ color: colors.text, fontFamily: fonts.tech, fontSize: 14, letterSpacing: 2.6 }}>
            GBENA GRANT
          </Text>
          <Text
            style={{
              color: colors.textFaint,
              fontFamily: fonts.medium,
              fontSize: 9.5,
              letterSpacing: 2.2,
              marginTop: 1,
            }}
          >
            PREMIUM CINEMA
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        {pending > 0 ? (
          <View style={styles.pending}>
            <Text style={{ color: colors.accentText, fontFamily: fonts.bold, fontSize: 10 }}>{pending}</Text>
          </View>
        ) : null}
        <RoundIconButton
          icon="download-outline"
          size={38}
          variant="glass"
          accessibilityLabel="Downloads"
          onPress={() => navigation.navigate('Downloads')}
        />
        <RoundIconButton
          icon="notifications-outline"
          size={38}
          variant="glass"
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate('Tabs', { screen: 'Profile' } as never)}
        />
        <ScalePressable
          scaleTo={0.92}
          onPress={() => navigation.navigate('Tabs', { screen: 'Profile' } as never)}
          style={[
            styles.avatar,
            { borderColor: colors.accentLine, backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Text style={{ color: colors.accent, fontFamily: fonts.bold, fontSize: 12 }}>GG</Text>
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pending: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#F0B429',
  },
});
