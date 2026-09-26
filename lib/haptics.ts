import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export function tap(): void {
  if (!supported) return;
  Haptics.selectionAsync().catch(() => undefined);
}

export function thump(): void {
  if (!supported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

export function success(): void {
  if (!supported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
