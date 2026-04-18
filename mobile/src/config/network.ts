import { NativeModules, Platform } from 'react-native';

function getHostFromScriptUrl() {
  const scriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;
  const match = scriptUrl?.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
  return match?.[1] ?? null;
}

function getBackendHost() {
  const override = (globalThis as typeof globalThis & { __AURA_BACKEND_HOST__?: string }).__AURA_BACKEND_HOST__;
  if (override) {
    return override;
  }

  if (Platform.OS !== 'android') {
    return 'localhost';
  }

  const host = getHostFromScriptUrl();
  
  // If we're on a physical device (hotspot), 10.0.2.2 won't work.
  // We prefer the laptop's hotspot IP (192.168.137.1) specifically for physical phones.
  if (host === '10.0.2.2' || host === 'localhost' || host === '127.0.0.1') {
    // Check if we are likely on an emulator (10.0.2.2 is usually the bundler host for emulators)
    if (host === '10.0.2.2') {
        return '10.0.2.2';
    }
    // If it's localhost, let's assume adb reverse is being used or fallback to hotspot IP
    return '192.168.137.1';
  }

  if (host) {
    return host;
  }

  return '192.168.137.1';
}

export const BACKEND_HOST = getBackendHost();
export const BACKEND_URL = `http://${BACKEND_HOST}:3000`;
