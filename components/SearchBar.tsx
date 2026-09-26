import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeProvider';
import { tap } from '../lib/haptics';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Films, directors, genres\u2026',
  onSubmit,
  onCancel,
  loading = false,
  autoFocus = false,
}: SearchBarProps) {
  const { colors, fonts, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.accentLine : colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={focused ? colors.accent : colors.textFaint} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => {
            onSubmit?.();
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={autoFocus}
          clearButtonMode="never"
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: fonts.medium,
            fontSize: 15,
            paddingVertical: 0,
            ...(typeof document === 'undefined' ? null : ({ outlineStyle: 'none' } as object)),
          }}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : value.length > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              tap();
              onChangeText('');
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {onCancel && (focused || value.length > 0) ? (
        <Pressable
          hitSlop={8}
          onPress={() => {
            tap();
            onChangeText('');
            onCancel();
          }}
        >
          <Text style={{ color: colors.accent, fontFamily: fonts.semi, fontSize: 14 }}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
});
