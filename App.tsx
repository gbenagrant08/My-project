import 'react-native-gesture-handler';

import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';

import { AppStoreProvider } from './lib/store/AppStore';
import { ThemeProvider, useTheme } from './lib/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FONT_MAP = {
  'Outfit-Light': require('./assets/fonts/Outfit-Light.ttf'),
  'Outfit-Regular': require('./assets/fonts/Outfit-Regular.ttf'),
  'Outfit-Medium': require('./assets/fonts/Outfit-Medium.ttf'),
  'Outfit-SemiBold': require('./assets/fonts/Outfit-SemiBold.ttf'),
  'Outfit-Bold': require('./assets/fonts/Outfit-Bold.ttf'),
  'Outfit-ExtraBold': require('./assets/fonts/Outfit-ExtraBold.ttf'),
  'PlayfairDisplay-Medium': require('./assets/fonts/PlayfairDisplay-Medium.ttf'),
  'PlayfairDisplay-SemiBold': require('./assets/fonts/PlayfairDisplay-SemiBold.ttf'),
  'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
  'PlayfairDisplay-Black': require('./assets/fonts/PlayfairDisplay-Black.ttf'),
  'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
  'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
  ...Ionicons.font,
};

function Shell() {
  const { colors } = useTheme();

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.elevated,
        text: colors.text,
        border: colors.borderSoft,
        notification: colors.accent,
      },
    }),
    [colors],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

function Booting() {
  return (
    <View style={styles.boot}>
      <View style={styles.bootMark}>
        <Text style={styles.bootLetter}>G</Text>
      </View>
      <Text style={styles.bootTitle}>GBENA GRANT</Text>
      <Text style={styles.bootSub}>PREMIUM CINEMA</Text>
      <ActivityIndicator color="#F0B429" style={{ marginTop: 26 }} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const ready = Boolean(fontsLoaded || fontError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return <Booting />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <ThemeProvider>
            <Shell />
          </ThemeProvider>
        </AppStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C0C12' },
  boot: {
    flex: 1,
    backgroundColor: '#0C0C12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootMark: {
    width: 74,
    height: 74,
    borderRadius: 20,
    backgroundColor: '#F0B429',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  bootLetter: { color: '#1A1305', fontSize: 40, fontWeight: '700', lineHeight: 48 },
  bootTitle: { color: '#F7F6F3', fontSize: 17, letterSpacing: 4.2, fontWeight: '600' },
  bootSub: { color: '#6E6E7E', fontSize: 9.5, letterSpacing: 3, marginTop: 6 },
});
