import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeProvider';

interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  top?: boolean;
  bottom?: boolean;
}

export function Screen({ children, style, top = true, bottom = false }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: top ? insets.top : 0,
          paddingBottom: bottom ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
