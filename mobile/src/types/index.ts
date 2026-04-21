import type { NativeStackScreenProps } from '@react-navigation/native-stack';
export * from './navigation';
export * from './components';
export * from './models';
import type { RootStackParamList } from './navigation';

export type EntryScreenProps = NativeStackScreenProps<RootStackParamList, 'Entry'>;
export type RoomScreenProps = NativeStackScreenProps<RootStackParamList, 'Room'>;
export type AdminScreenProps = NativeStackScreenProps<RootStackParamList, 'Admin'>;
export type MembersScreenProps = NativeStackScreenProps<RootStackParamList, 'Members'>;

