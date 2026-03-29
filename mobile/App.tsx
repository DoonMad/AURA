import './global.css';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EntryScreen from './src/screens/EntryScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

export default function App() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      let id = await AsyncStorage.getItem('deviceId');
      if (!id) {
        id = uuid.v4();
        await AsyncStorage.setItem('deviceId', id);
      }
      setDeviceId(id);
    };

    init().catch((error) => {
      console.warn('Failed to initialize app storage:', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <EntryScreen deviceId={deviceId} />
    </SafeAreaProvider>
  );
}