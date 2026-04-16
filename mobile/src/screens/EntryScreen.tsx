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
import type { EntryScreenProps, Room, User } from '../types';
import useAppStore from '../store/useAppStore';

const EntryScreen: React.FC<EntryScreenProps> = ({ navigation }) => {
  // ── Read identity from the global store ──
  const deviceId = useAppStore((s) => s.deviceId);
  const socket = useAppStore((s) => s.socket);
  const storedDisplayName = useAppStore((s) => s.displayName);

  // Local state for the text input (so typing doesn't write to store on every keystroke)
  const [displayName, setDisplayName] = useState(storedDisplayName ?? '');
  const [roomId, setRoomId] = useState('');

  // If the store already has a saved displayName, pre-fill the input
  useEffect(() => {
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
    }
  }, [storedDisplayName]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data: { room: Room; users: User[] }) => {
      console.log('Room joined:', data.room);

      // ── Write to the global store ──
      useAppStore.getState().setRoom(data.room);
      useAppStore.getState().setMembers(data.users);

      // Navigate without passing any params — RoomScreen reads from the store
      navigation.navigate('Room');
    };

    const handleError = (error: any) => {
      console.warn('Socket error:', error);
    };

    socket.on('roomJoined', handleRoomJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('roomJoined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, [socket, navigation]);

  const handleJoinRoom = async () => {
    if (!displayName) {
      console.warn('Please enter a display name');
      return;
    }
    if (!socket || !deviceId) return;
    if (roomId && roomId.length === 6) {
      // Commit displayName to store + AsyncStorage
      useAppStore.getState().setDisplayName(displayName);
      await AsyncStorage.setItem('displayName', displayName);

      socket.emit('joinRoom', { deviceId, displayName, roomId });
    }
  };

  const handleCreateRoom = async () => {
    if (!displayName) {
      console.warn('Please enter a display name');
      return;
    }
    if (!socket || !deviceId) return;

    // Commit displayName to store + AsyncStorage
    useAppStore.getState().setDisplayName(displayName);
    await AsyncStorage.setItem('displayName', displayName);

    socket.emit('createRoom', { deviceId, displayName });
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

            {/* Hardware Debug Button */}
            <View className="mt-8">
              <PrimaryButton
                title="Debug Hardware Mic"
                onPress={() => navigation.navigate('MicTester')}
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
