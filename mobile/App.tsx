import './global.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntryScreen from './src/screens/EntryScreen';
import RoomScreen from './src/screens/RoomScreen';
import MembersScreen from './src/screens/MembersScreen';
import MicTesterScreen from './src/screens/MicTesterScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { RootStackParamList } from './src/types/navigation';
import useAppStore from './src/store/useAppStore';
import getSocket from './src/services/socket';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
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

      setIsReady(true);
    };

    init().catch((error) => {
      console.warn('Failed to initialize app storage:', error);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    const socket = useAppStore.getState().socket;
    if (!socket) {
      return;
    }

    const handleConnectError = (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to reach the backend server.';
      useAppStore.getState().setNotice({
        tone: 'error',
        title: 'Connection Failed',
        message: message.includes('xhr poll error') || message.includes('websocket error')
          ? 'The app cannot reach the backend server. Please check your network or server URL.'
          : message,
      });
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') {
        return;
      }

      useAppStore.getState().setNotice({
        tone: 'warning',
        title: 'Disconnected',
        message: 'The live connection dropped. The app will try to reconnect automatically.',
      });
    };

    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
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
            name="Members"
            component={MembersScreen}
          />
          <Stack.Screen
            name="MicTester"
            component={MicTesterScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
