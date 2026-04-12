import './global.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntryScreen from './src/screens/EntryScreen';
import RoomScreen from './src/screens/RoomScreen';
import MembersScreen from './src/screens/MembersScreen';
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}