import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { Tabs } from './Tabs';
import { MovieDetailScreen } from '../screens/MovieDetailScreen';
import { GenreScreen } from '../screens/GenreScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { useTheme } from '../lib/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
        animationDuration: 260,
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Movie"
        component={MovieDetailScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Genre" component={GenreScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
