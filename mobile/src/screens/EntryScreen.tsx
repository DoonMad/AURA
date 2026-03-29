/**
 * EntryScreen — The AURA Command Module entry screen.
 *
 * Assembles reusable components into the initial screen layout where a user
 * enters their display name and either creates or joins a room.
 *
 * Uses NativeWind (className) for styling.
 * Uses inline style only for letterSpacing (not supported by NativeWind).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextInputField from '../components/TextInputField';
import PrimaryButton from '../components/PrimaryButton';
import SectionDivider from '../components/SectionDivider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createIOConnection from '../services/socket';
import type { EntryScreenProps } from '../types/components';


const EntryScreen: React.FC<EntryScreenProps> = ({ deviceId }) => {
  const [displayName, setDisplayName] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    const getDisplayName = async () => {
      let name = await AsyncStorage.getItem('displayName');
      if (name) {
        setDisplayName(name);
      }
    };

    getDisplayName();
  }, []);

  const handleJoinRoom = async () => {
    if (roomId && roomId.length === 6) {
      const socket = createIOConnection();
      socket.emit('joinRoom', { deviceId, displayName, roomId });
      await AsyncStorage.setItem('displayName', displayName);
    }
  };

  const handleCreateRoom = async () => {
    const socket = createIOConnection();
    socket.emit('createRoom', { deviceId, displayName });
    await AsyncStorage.setItem('displayName', displayName);
  };



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
                onChangeText={(e) => {setDisplayName(e)}}
                autoCapitalize="words"
              />
            </View>

            {/* Create Room */}
            <View className="mb-aura-lg">
              <PrimaryButton
                title="Create Room"
                onPress={handleCreateRoom}
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
                value={roomId}
                onChangeText={(e) => {setRoomId(e)}}
                autoCapitalize="characters"
              />
              <View className="h-aura-md" />
              <PrimaryButton
                title="Join Room"
                onPress={handleJoinRoom}
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
