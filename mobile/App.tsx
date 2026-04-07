import './global.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntryScreen from './src/screens/EntryScreen';
import RoomScreen from './src/screens/RoomScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { RootStackParamList } from './src/types/navigation';
import MembersScreen from './src/screens/MembersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      let id = await AsyncStorage.getItem('deviceId');
      if (!id) {
        id = uuid.v4();
        await AsyncStorage.setItem('deviceId', id);
      }
      setDeviceId(id);
      setIsReady(true);
    };

    init().catch((error) => {
      console.warn('Failed to initialize app storage:', error);
      setIsReady(true);
    });
  }, []);

  if (!isReady || !deviceId) {
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
            initialParams={{ deviceId }}
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