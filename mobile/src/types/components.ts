/**
 * Prop type definitions for all reusable AURA UI components.
 */

import { StyleProp, ViewStyle } from 'react-native';

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
 * RoomHeader
 * ──────────────────────────────────────────── */

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

export interface RoomHeaderProps {
  roomName: string;
  connectionState: ConnectionState;
  onSharePress?: () => void;
}


/* ────────────────────────────────────────────
 * PushToTalkButton
 * ──────────────────────────────────────────── */

export type TalkState = 'idle' | 'ready' | 'speaking_self' | 'speaking_other';

export interface PushToTalkButtonProps {
  state: TalkState;
  onPress?: () => void;
}

/* ────────────────────────────────────────────
 * MemberListItem
 * ──────────────────────────────────────────── */

export interface MemberListItemProps {
  name: string;
  isSpeaking?: boolean;
}

/* ────────────────────────────────────────────
 * ChannelLabel
 * ──────────────────────────────────────────── */

export interface ChannelLabelProps {
  channelName: string;
}

/* ────────────────────────────────────────────
 * BottomControls
 * ──────────────────────────────────────────── */

export interface BottomControlsProps {
  memberChannelCount: number;
  totalMemberCount: number;
  onMembersPress?: () => void;
  onLeavePress?: () => void;
  onSharePress?: () => void;
  volume: number;
  onVolumeChange?: (volume: number) => void;
}

/* ────────────────────────────────────────────
 * SpeakerArea
 * ──────────────────────────────────────────── */

export interface SpeakerAreaProps {
  speakerName?: string;
  isActive?: boolean;
}

/* ────────────────────────────────────────────
 * RotaryDial
 * ──────────────────────────────────────────── */

export type ChannelState = 'free' | 'speaking' | 'idle';

export type DialChannel = { id: string; name: string; state: ChannelState };

export interface RotaryDialProps {
  channels: DialChannel[];
  currentChannelId: string;
}

/* ────────────────────────────────────────────
 * MembersScreen
 * ──────────────────────────────────────────── */

export type Member = { id: string; name: string; isSpeaking?: boolean };

export interface MembersScreenProps {
  currentChannelMembers: Member[];
  allMembers: Member[];
  showAdminControls?: boolean;
  onCreateChannel?: () => void;
  onRenameChannel?: () => void;
}

