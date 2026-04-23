import './global.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntryScreen from './src/screens/EntryScreen';
import RoomScreen from './src/screens/RoomScreen';
import AdminScreen from './src/screens/AdminScreen';
import MembersScreen from './src/screens/MembersScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { RootStackParamList } from './src/types/navigation';
import useAppStore from './src/store/useAppStore';
import getSocket from './src/services/socket';
import { triggerHaptic } from './src/services/haptics';
import { Linking } from 'react-native';
import { BackgroundService } from './src/services/BackgroundService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await BackgroundService.init();
      // ── Load or create deviceId ──
      let id = await AsyncStorage.getItem('deviceId');
      if (!id) {
        id = uuid.v4();
        await AsyncStorage.setItem('deviceId', id);
      }

      // ── Load saved displayName (may be null on first launch) ──
      const savedName = await AsyncStorage.getItem('displayName');

      // ── Seed the Zustand store ──
      useAppStore.getState().setIdentity(id, savedName);

      // ── Create the socket connection once and store it globally ──
      const socket = getSocket();
      useAppStore.getState().setSocket(socket);
      useAppStore.getState().setConnectionState(socket.connected ? 'connected' : 'disconnected');

      setIsReady(true);
    };

    init().catch((error) => {
      console.warn('Failed to initialize app storage:', error);
      setIsReady(true);
    });
  }, []);

  // ── Handle Deep Links ──
  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      console.log('[App] Deep link received:', url);
      // Expected format: aura://join/ABCDEF
      const match = url.match(/aura:\/\/join\/([A-Z0-9]+)/i);
      if (match && match[1]) {
        const roomId = match[1].toUpperCase();
        console.log('[App] Parsed Room ID from deep link:', roomId);
        useAppStore.getState().setPendingDeepLinkRoomId(roomId);
      }
    };

    // Handle link when app is cold-booted
    Linking.getInitialURL().then(handleDeepLink);

    // Handle link when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const socket = useAppStore.getState().socket;
    if (!socket) {
      return;
    }

    const handleConnect = () => {
      const store = useAppStore.getState();
      store.setConnectionState('connected');

      if (store.notice?.title === 'Disconnected') {
        store.setNotice(null);
      }

      if (store.sessionRestorePending && store.room && store.deviceId && store.displayName) {
        socket.emit('joinRoom', {
          deviceId: store.deviceId,
          displayName: store.displayName,
          roomId: store.room.id,
        });
      }
    };

    const handleConnectError = (error: unknown) => {
      useAppStore.getState().setConnectionState('reconnecting');
      const message = error instanceof Error ? error.message : 'Unable to reach the backend server.';
      useAppStore.getState().setNotice({
        tone: 'error',
        title: 'Connection Failed',
        message: message.includes('xhr poll error') || message.includes('websocket error')
          ? 'The app cannot reach the backend server. Please check your network or server URL.'
          : message,
      });
      triggerHaptic('error');
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') {
        return;
      }

      const store = useAppStore.getState();
      store.setConnectionState('reconnecting');
      if (store.room) {
        store.setSessionRestorePending(true);
      }
      store.setNotice({
        tone: 'warning',
        title: 'Disconnected',
        message: 'The live connection dropped. The app will try to reconnect automatically.',
      });
      triggerHaptic('warning');
    };

    const handleReconnectAttempt = () => {
      useAppStore.getState().setConnectionState('reconnecting');
    };

    const handleReconnect = () => {
      handleConnect();
    };

    const handleReconnectError = () => {
      useAppStore.getState().setConnectionState('reconnecting');
      useAppStore.getState().setNotice({
        tone: 'error',
        title: 'Reconnect Failed',
        message: 'The app is still trying to restore the connection.',
      });
      triggerHaptic('error');
    };

    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect', handleConnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_error', handleReconnectError);

    // If the socket connected before this effect attached listeners,
    // sync the store immediately so room initialization is not blocked.
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect', handleConnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_error', handleReconnectError);
    };
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Entry"
            component={EntryScreen}
          />
          <Stack.Screen
            name="Room"
            component={RoomScreen}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
          />
          <Stack.Screen
            name="Members"
            component={MembersScreen}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
