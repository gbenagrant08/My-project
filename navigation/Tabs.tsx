import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabParamList } from './types';
import { useTheme } from '../lib/ThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof TabParamList, { off: IconName; on: IconName; label: string }> = {
  Home: { off: 'home-outline', on: 'home', label: 'Home' },
  Search: { off: 'search-outline', on: 'search', label: 'Search' },
  Library: { off: 'bookmark-outline', on: 'bookmark', label: 'Library' },
  Profile: { off: 'person-outline', on: 'person', label: 'Profile' },
};

export function Tabs() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const barHeight = 60 + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 6));

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.elevated,
          borderTopColor: colors.borderSoft,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: barHeight,
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 6,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semi,
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIcon: ({ color, focused }) => {
          const cfg = ICONS[route.name];
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={focused ? cfg.on : cfg.off} size={22} color={color} />
              {focused ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -7,
                    width: 16,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: colors.accent,
                  }}
                />
              ) : null}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
