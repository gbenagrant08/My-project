import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface ScalePressableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export function ScalePressable({
  children,
  style,
  scaleTo = 0.955,
  onPressIn,
  onPressOut,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? scaleTo : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [active, scale, scaleTo]);

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setActive(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setActive(false);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </Pressable>
  );
}
