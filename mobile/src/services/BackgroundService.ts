import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

const CHANNEL_ID = 'aura-background-v2';
let channelReady = false;

async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;

  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'AURA Service',
      importance: AndroidImportance.LOW,
      description: 'Maintains live connection to AURA frequency',
      vibration: false,
    });
    channelReady = true;
  } catch (error) {
    console.warn('[BackgroundService] Failed to create channel:', error);
  }
}

function buildBody(roomName: string, channelName: string, speakerName?: string | null, fallbackText?: string) {
  const safeRoomName = (roomName || 'UNKNOWN').toUpperCase();
  const safeChannelName = channelName || 'ALPHA';

  if (fallbackText) {
    return fallbackText;
  }

  if (speakerName) {
    return `${speakerName} is speaking...`;
  }

  return `Freq: ${safeRoomName} | CH: ${safeChannelName}`;
}

async function displayServiceNotification(
  roomName: string,
  channelName: string,
  speakerName?: string | null,
  fallbackText?: string,
) {
  await ensureChannel();

  await notifee.displayNotification({
    id: 'aura-service-notification',
    title: 'AURA Connected',
    body: buildBody(roomName, channelName, speakerName, fallbackText),
    android: {
      channelId: CHANNEL_ID,
      asForegroundService: true,
      onlyAlertOnce: true,
      color: '#22C55E',
      colorized: true,
      ongoing: true,
      autoCancel: false,
      pressAction: {
        id: 'default',
      },
    },
  });
}

export const BackgroundService = {
  async init() {
    await ensureChannel();
  },

  async startService(roomName: string, channelName: string, fallbackText?: string) {
    if (Platform.OS !== 'android') return;

    try {
      await displayServiceNotification(roomName, channelName, null, fallbackText);
    } catch (error) {
      console.warn('[BackgroundService] Failed to start service:', error);
    }
  },

  async updateSpeakerStatus(roomName: string, channelName: string, speakerName: string | null) {
    if (Platform.OS !== 'android') return;

    try {
      await displayServiceNotification(roomName, channelName, speakerName);
    } catch (error) {
      console.warn('[BackgroundService] Failed to update service notification:', error);
    }
  },

  async stopService() {
    if (Platform.OS !== 'android') return;

    try {
      await notifee.stopForegroundService();
    } catch (error) {
      console.warn('[BackgroundService] Failed to stop service:', error);
    }
  },
};
