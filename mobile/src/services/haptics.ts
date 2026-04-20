import { Platform, Vibration } from 'react-native';

type HapticKind = 'light' | 'medium' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  medium: [0, 18],
  success: [0, 20, 30, 20],
  warning: [0, 30, 20, 30],
  error: [0, 40, 30, 40],
};

export function triggerHaptic(kind: HapticKind) {
  const pattern = PATTERNS[kind];

  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(pattern);
      return;
    }

    Vibration.vibrate(pattern);
  } catch (error) {
    console.warn('[haptics] failed to vibrate', error);
  }
}
