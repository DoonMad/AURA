/**
 * EntryScreen — The AURA Command Module entry screen.
 *
 * Assembles reusable components into the initial screen layout where a user
 * enters their display name and either creates or joins a room.
 *
 * Uses NativeWind (className) for styling.
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
import SystemBanner from '../components/SystemBanner';
import { triggerHaptic } from '../services/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EntryScreenProps, Room, User } from '../types';
import useAppStore from '../store/useAppStore';

const EntryScreen: React.FC<EntryScreenProps> = ({ navigation }) => {
  const deviceId = useAppStore(s => s.deviceId);
  const socket = useAppStore(s => s.socket);
  const storedDisplayName = useAppStore(s => s.displayName);
  const pendingDeepLinkRoomId = useAppStore(s => s.pendingDeepLinkRoomId);
  const notice = useAppStore(s => s.notice);
  const setNotice = useAppStore(s => s.setNotice);

  const [displayName, setDisplayName] = useState(storedDisplayName ?? '');
  const [roomId, setRoomId] = useState('');

  // ── Handle Pending Deep Link ──
  useEffect(() => {
    if (pendingDeepLinkRoomId) {
      console.log('[EntryScreen] Consuming pending deep link:', pendingDeepLinkRoomId);
      setRoomId(pendingDeepLinkRoomId);
      
      // Clear the pending ID so we don't process it again
      useAppStore.getState().setPendingDeepLinkRoomId(null);

      // If we already have a name, let's try to join automatically
      if (displayName || storedDisplayName) {
        // We need to wait a tick for setRoomId state to reflect or just use the value directly
        const nameToUse = displayName || storedDisplayName;
        console.log('[EntryScreen] Auto-joining room via deep link as:', nameToUse);
        
        if (socket && deviceId) {
          useAppStore.getState().setDisplayName(nameToUse!);
          // We can't call handleJoinRoom directly because it relies on state 
          // that might not be updated yet. So we duplicate the emit logic here.
          setNotice({
            tone: 'info',
            title: 'Joining Room',
            message: `Auto-joining freq: ${pendingDeepLinkRoomId}.`,
          });
          socket.emit('joinRoom', { deviceId, displayName: nameToUse, roomId: pendingDeepLinkRoomId });
        }
      }
    }
  }, [pendingDeepLinkRoomId, socket, deviceId, displayName, storedDisplayName]);

  useEffect(() => {
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
    }
  }, [storedDisplayName]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomJoined = (data: { room: Room; users: User[] }) => {
      console.log('Room joined:', data.room);
      setNotice(null);
      useAppStore.getState().setSessionRestorePending(false);
      useAppStore.getState().setRoom(data.room);
      useAppStore.getState().setMembers(data.users);
      triggerHaptic('success');
      navigation.navigate('Room');
    };

    const handleError = (error: any) => {
      const message =
        typeof error?.message === 'string'
          ? error.message
          : 'Unable to join the room.';
      setNotice({
        tone: 'error',
        title: 'Room Error',
        message,
      });
      triggerHaptic('error');
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
      setNotice({
        tone: 'warning',
        title: 'Missing Name',
        message: 'Please enter a display name before joining a room.',
      });
      triggerHaptic('warning');
      return;
    }
    if (!socket || !deviceId) return;
    const trimmedRoomId = roomId.trim().toUpperCase();
    if (trimmedRoomId.length !== 6) {
      setNotice({
        tone: 'warning',
        title: 'Invalid Room',
        message: 'Enter the 6-character room code to join.',
      });
      triggerHaptic('warning');
      return;
    }
    setNotice({
      tone: 'info',
      title: 'Joining Room',
      message: `Attempting to join ${trimmedRoomId}.`,
    });
    triggerHaptic('light');
    useAppStore.getState().setDisplayName(displayName);
    await AsyncStorage.setItem('displayName', displayName);
    socket.emit('joinRoom', { deviceId, displayName, roomId: trimmedRoomId });
  };

  const handleCreateRoom = async () => {
    if (!displayName) {
      setNotice({
        tone: 'warning',
        title: 'Missing Name',
        message: 'Please enter a display name before creating a room.',
      });
      triggerHaptic('warning');
      return;
    }
    if (!socket || !deviceId) return;
    setNotice({
      tone: 'info',
      title: 'Creating Room',
      message: 'Generating a new command room now.',
    });
    triggerHaptic('light');
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
          contentContainerClassName="flex-grow justify-center px-8 py-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-5xl font-black text-primary tracking-[8px]">
              AURA
            </Text>
            <View className="mt-2 flex-row items-center opacity-80">
              <View className="w-2 h-2 rounded-full bg-aura-active mr-2 shadow-glow-active" />
              <Text className="text-sm text-aura-muted font-bold uppercase tracking-[4px]">
                Command Module
              </Text>
            </View>
          </View>

          {notice && (
            <SystemBanner notice={notice} onDismiss={() => setNotice(null)} />
          )}

          {/* Form */}
          <View className="w-full max-w-sm mx-auto p-6 bg-surface rounded-2xl border border-aura-border shadow-lg">
            <View className="mb-6">
              <Text className="text-xs text-aura-muted mb-2 font-bold uppercase tracking-wider">
                Operative ID
              </Text>
              <TextInputField
                placeholder="Enter designation"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <PrimaryButton
                title="Create Room"
                onPress={handleCreateRoom}
                variant="filled"
              />
            </View>

            <SectionDivider label="OR CONNECT" />

            <View className="mb-2">
              <Text className="text-xs text-aura-muted mb-2 font-bold uppercase tracking-wider">
                Target Frequency
              </Text>
              <TextInputField
                placeholder="6-Digit Code"
                value={roomId}
                onChangeText={value => setRoomId(value.toUpperCase())}
                autoCapitalize="characters"
              />
              <View className="h-4" />
              <PrimaryButton
                title="Join Room"
                onPress={handleJoinRoom}
                variant="outline"
              />
            </View>
          </View>

          {/* Hardware Debug Button */}
          <View className="mt-12 w-full max-w-sm mx-auto">
            <PrimaryButton
              title="Mic Tester"
              onPress={() => navigation.navigate('MicTester')}
              variant="outline"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EntryScreen;
