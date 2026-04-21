/**
 * @format
 */
import { registerGlobals } from 'react-native-webrtc';
registerGlobals();

import notifee, { EventType } from '@notifee/react-native';

// Android 14+ Requires a registered foreground service task before showing a Foreground Service Notification
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Keep the service running
    console.log('[service] foreground service task registered via index.js');
  });
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  switch (type) {
    case EventType.PRESS:
      console.log('[notifee] background notification pressed', detail?.notification?.id);
      break;
    case EventType.ACTION_PRESS:
      console.log('[notifee] background action pressed', detail?.pressAction?.id);
      break;
    default:
      break;
  }
});


import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
