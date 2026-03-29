/**
 * Prop type definitions for all reusable AURA UI components.
 */

import { StyleProp, TextStyle, ViewStyle } from 'react-native';

/* ────────────────────────────────────────────
 * TextInputField
 * ──────────────────────────────────────────── */

export interface TextInputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: StyleProp<ViewStyle>;
}

/* ────────────────────────────────────────────
 * PrimaryButton
 * ──────────────────────────────────────────── */

export type ButtonVariant = 'filled' | 'outline';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/* ────────────────────────────────────────────
 * SectionDivider
 * ──────────────────────────────────────────── */

export interface SectionDividerProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/* ────────────────────────────────────────────
 * EntryScreen
 * ──────────────────────────────────────────── */

export interface EntryScreenProps {
  deviceId: string | null;
}
