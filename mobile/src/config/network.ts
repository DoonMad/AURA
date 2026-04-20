import { NativeModules, Platform } from 'react-native';

const DEFAULT_BACKEND_HOST = '192.168.137.1';

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
    return DEFAULT_BACKEND_HOST;
  }

  const host = getHostFromScriptUrl();
  if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
    return host;
  }

  return DEFAULT_BACKEND_HOST;
}

function getBackendUrl() {
  const overrideUrl = (globalThis as typeof globalThis & { __AURA_BACKEND_URL__?: string }).__AURA_BACKEND_URL__;
  if (overrideUrl) {
    return overrideUrl;
  }

  const host = getBackendHost();
  return `http://${host}:3000`;
}

export const BACKEND_HOST = getBackendHost();
export const BACKEND_URL = getBackendUrl();
