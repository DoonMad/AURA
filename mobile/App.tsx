import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EntryScreen from './src/screens/EntryScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <EntryScreen
        displayName=""
        onDisplayNameChange={() => {}}
        onCreateRoom={() => {}}
        roomCode=""
        onRoomCodeChange={() => {}}
        onJoinRoom={() => {}}
      />
    </SafeAreaProvider>
  );
}