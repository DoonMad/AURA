import { NativeModules, NativeEventEmitter } from 'react-native';

const { WatchBridge } = NativeModules;
const watchEmitter = new NativeEventEmitter(WatchBridge);

export type WatchRoomState = {
  roomId: string;
  channelId: string;
  channelName: string;
  activeSpeakerName: string | null;
  isConnected: boolean;
  isInRoom: boolean;
  micSource: 'phone' | 'watch' | 'external';
  isWatchActive: boolean;
};

export const WatchBridgeService = {
  sendMessage: (path: string, message: string) => {
    WatchBridge.sendMessage(path, message);
  },

  updateRoomState: (state: WatchRoomState) => {
    WatchBridge.updateRoomState(JSON.stringify(state));
  },

  onMessage: (callback: (event: { path: string; data: string }) => void) => {
    return watchEmitter.addListener('onWatchMessage', callback);
  },

  onAudioFrame: (callback: (base64Data: string) => void) => {
    return watchEmitter.addListener('onWatchAudioFrame', callback);
  },
};
