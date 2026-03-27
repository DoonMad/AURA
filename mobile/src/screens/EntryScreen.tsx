/**
 * EntryScreen — The AURA Command Module entry screen.
 *
 * Assembles reusable components into the initial screen layout where a user
 * enters their display name and either creates or joins a room.
 *
 * Uses NativeWind (className) for styling.
 * Uses inline style only for letterSpacing (not supported by NativeWind).
 */

import React from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EntryScreenProps } from '../types/components';
import TextInputField from '../components/TextInputField';
import PrimaryButton from '../components/PrimaryButton';
import SectionDivider from '../components/SectionDivider';

const EntryScreen: React.FC<EntryScreenProps> = ({
  displayName,
  onDisplayNameChange,
  onCreateRoom,
  roomCode,
  onRoomCodeChange,
  onJoinRoom,
}) => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-aura-xl py-aura-2xl"
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ─────────────────────────────── */}
          <View className="items-center mb-aura-2xl">
            <Text
              className="text-aura-2xl font-extrabold text-primary"
              style={{ letterSpacing: 6 }}
            >
              AURA
            </Text>
            <Text
              className="text-aura-sm text-aura-muted mt-aura-xs uppercase"
              style={{ letterSpacing: 2 }}
            >
              Command Module
            </Text>
          </View>

          {/* ── Form ───────────────────────────────── */}
          <View className="w-full">
            {/* Display Name */}
            <View className="mb-aura-lg">
              <Text className="text-aura-sm text-aura-muted mb-aura-sm font-medium">
                Your Identity
              </Text>
              <TextInputField
                placeholder="Enter your name"
                value={displayName}
                onChangeText={onDisplayNameChange}
                autoCapitalize="words"
              />
            </View>

            {/* Create Room */}
            <View className="mb-aura-lg">
              <PrimaryButton
                title="Create Room"
                onPress={onCreateRoom}
                variant="filled"
              />
            </View>

            {/* Divider */}
            <SectionDivider label="or" />

            {/* Join Room */}
            <View className="mb-aura-lg">
              <Text className="text-aura-sm text-aura-muted mb-aura-sm font-medium">
                Join Existing Room
              </Text>
              <TextInputField
                placeholder="Enter Room Code"
                value={roomCode}
                onChangeText={onRoomCodeChange}
                autoCapitalize="characters"
              />
              <View className="h-aura-md" />
              <PrimaryButton
                title="Join Room"
                onPress={onJoinRoom}
                variant="outline"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EntryScreen;
