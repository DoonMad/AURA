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
  if (host) {
    return host;
  }

  return '192.168.137.1';
}

export const BACKEND_HOST = getBackendHost();
export const BACKEND_URL = `http://${BACKEND_HOST}:3000`;
