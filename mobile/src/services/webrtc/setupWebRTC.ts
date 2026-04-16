import { registerGlobals } from 'react-native-webrtc';

let globalsRegistered = false;

export function setupWebRTC() {
  if (globalsRegistered) {
    return;
  }

  registerGlobals();
  globalsRegistered = true;
}

