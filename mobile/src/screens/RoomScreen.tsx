import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PermissionsAndroid, Platform, Text, View } from 'react-native'
// @ts-ignore
import { RTCView } from 'react-native-webrtc'
import { SafeAreaView } from 'react-native-safe-area-context'
import InCallManager from 'react-native-incall-manager'
import { Share } from 'react-native'
import RoomHeader from '../components/RoomHeader'
import SpeakerArea from '../components/SpeakerArea'
import PushToTalkButton from '../components/PushToTalkButton'
import BottomControls from '../components/BottomControls'
import ChannelSelector from '../components/ChannelSelector'
import SystemBanner from '../components/SystemBanner'
import ActivityToast from '../components/ActivityToast'
import type { ActivityToastItem } from '../components/ActivityToast'
import type { RoomScreenProps } from '../types'
import useAppStore, { useMemberById, useMembersArray } from '../store/useAppStore'
import { BACKEND_URL } from '../config/network'
import { triggerHaptic } from '../services/haptics'
import type { SignalLevel } from '../components/SignalBars'
import InviteModal from '../components/InviteModal'
import { BackgroundService } from '../services/BackgroundService'

const RoomScreen: React.FC<RoomScreenProps> = ({ navigation }) => {
  const room = useAppStore((s) => s.room)
  const socket = useAppStore((s) => s.socket)
  const deviceId = useAppStore((s) => s.deviceId)
  const notice = useAppStore((s) => s.notice)
  const setNotice = useAppStore((s) => s.setNotice)
  const micSource = useAppStore((s) => s.micSource)
  const setMicSource = useAppStore((s) => s.setMicSource)
  const connectionState = useAppStore((s) => s.connectionState)
  const sessionRestorePending = useAppStore((s) => s.sessionRestorePending)
  const setSessionRestorePending = useAppStore((s) => s.setSessionRestorePending)
  const members = useMembersArray()
  const mediasoupSession = useRef<any>(null)
  const mediasoupSessionLoad = useRef<Promise<void> | null>(null)
  const pttInFlightRef = useRef(false)
  const pttHeldRef = useRef(false)
  const backgroundServiceActiveRef = useRef(false)
  const backgroundServiceSyncingRef = useRef(false)
  const [mediaSessionReady, setMediaSessionReady] = useState(false)
  const [mediasoupReady, setMediasoupReady] = useState(false)
  const [tracksVersion, setTracksVersion] = useState(0)

  const channels = useMemo(() => (room ? Object.values(room.channels) : []), [room])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const selectedChannel = useMemo(() => channels?.find((c) => c.id === selectedChannelId), [channels, selectedChannelId])
  const activeSpeakerId = selectedChannel?.activeSpeaker || null
  const [volume, setVolume] = useState(0.5)
  const [micPermissionGranted, setMicPermissionGranted] = useState(Platform.OS !== 'android')
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(Platform.OS !== 'android')
  const [activityToasts, setActivityToasts] = useState<ActivityToastItem[]>([])
  let toastCounter = useRef(0)
  const [signalLevel, setSignalLevel] = useState<SignalLevel>(0)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const isAdmin = !!room && !!deviceId && room.admins.includes(deviceId)

  const addActivityToast = (message: string, type: 'join' | 'leave') => {
    const id = `toast-${Date.now()}-${toastCounter.current++}`;
    setActivityToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  };

  const removeActivityToast = (id: string) => {
    setActivityToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (data: { room: any; users: any[] }) => {
      if (!data?.room || !Array.isArray(data.users)) return;
      console.log('[room] roomUpdated', data.room.id, data.users.length);

      if (sessionRestorePending && room?.id === data.room.id) {
        setSessionRestorePending(false);
        triggerHaptic('success');
      }

      useAppStore.getState().setRoom(data.room);
      useAppStore.getState().setMembers(data.users);
    };

    const handleMicStateUpdated = (data: { roomId: string; channelId: string; activeSpeaker: string | null; users: any[] }) => {
      console.log('[room] micStateUpdated', data.roomId, data.channelId, data.activeSpeaker);
      const currentRoom = useAppStore.getState().room;
      if (!currentRoom || currentRoom.id !== data.roomId) {
        console.log('[room] ignoring micStateUpdated for stale room');
        return;
      }

      const nextRoom = {
        ...currentRoom,
        channels: {
          ...currentRoom.channels,
          [data.channelId]: {
            ...currentRoom.channels[data.channelId],
            activeSpeaker: data.activeSpeaker
          }
        }
      };

      useAppStore.getState().setRoom(nextRoom);
      if (Array.isArray(data.users)) {
        useAppStore.getState().setMembers(data.users);
      }
    };

    const handleRoomLeft = (data?: { reason?: string }) => {
      console.log('[room] roomLeft received', data?.reason ?? 'unknown');
      mediasoupSession.current?.dispose();
      if (Platform.OS === 'android' && backgroundServiceActiveRef.current) {
        void BackgroundService.stopService();
        backgroundServiceActiveRef.current = false;
      }
      if (data?.reason === 'kicked') {
        setNotice({
          tone: 'error',
          title: 'Removed From Room',
          message: 'An admin removed you from the room.',
        });
        triggerHaptic('error');
      }
      useAppStore.getState().clearSession();
      navigation.navigate('Entry');
    };

    const handleMicGranted = (data: { roomId?: string; channelId?: string }) => {
      if (!room || data.roomId !== room.id || data.channelId !== selectedChannelId) return;
      setNotice(null);
      triggerHaptic('success');
    };

    const handleMicDenied = (data: { roomId?: string; channelId?: string; reason?: string }) => {
      if (!data?.reason) return;

      const messages: Record<string, { title: string; message: string; tone: 'warning' | 'error' }> = {
        busy: {
          title: 'Mic Busy',
          message: 'Another operative is currently holding the channel mic.',
          tone: 'warning',
        },
        'not-in-channel': {
          title: 'Wrong Channel',
          message: 'You need to join the channel before speaking.',
          tone: 'warning',
        },
        'room-not-found': {
          title: 'Room Missing',
          message: 'This room no longer exists or could not be found.',
          tone: 'error',
        },
        'channel-not-found': {
          title: 'Channel Missing',
          message: 'The current channel could not be found.',
          tone: 'error',
        },
      };

      const next = messages[data.reason];
      if (!next) return;

      setNotice({
        tone: next.tone,
        title: next.title,
        message: next.message,
      });
      triggerHaptic(next.tone === 'warning' ? 'warning' : 'error');
    };

    const handleSocketError = (error: any) => {
      const message = typeof error?.message === 'string' ? error.message : 'Something went wrong while talking to the server.';
      setNotice({
        tone: 'error',
        title: 'Server Error',
        message,
      });
      triggerHaptic('error');

      if (sessionRestorePending && /room not found/i.test(message)) {
        mediasoupSession.current?.dispose();
        useAppStore.getState().clearSession();
        navigation.navigate('Entry');
      }
    };

    const handleUserJoined = (data: { name: string; deviceId: string }) => {
      if (data.deviceId === deviceId) return;
      addActivityToast(`${data.name} joined the room`, 'join');
    };

    const handleUserLeft = (data: { name: string; deviceId: string }) => {
      if (data.deviceId === deviceId) return;
      addActivityToast(`${data.name} left the room`, 'leave');
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('micStateUpdated', handleMicStateUpdated);
    socket.on('roomLeft', handleRoomLeft);
    socket.on('micGranted', handleMicGranted);
    socket.on('micDenied', handleMicDenied);
    socket.on('error', handleSocketError);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('micStateUpdated', handleMicStateUpdated);
      socket.off('roomLeft', handleRoomLeft);
      socket.off('micGranted', handleMicGranted);
      socket.off('micDenied', handleMicDenied);
      socket.off('error', handleSocketError);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [socket, navigation, room?.id, selectedChannelId, sessionRestorePending]);

  useEffect(() => {
    if (!InCallManager) {
        console.warn('InCallManager is not available (checking if on emulator?)');
        return;
    }
    try {
        InCallManager.start({ media: 'audio' });
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
        InCallManager.requestAudioFocus?.().catch?.(() => {});
        void InCallManager.chooseAudioRoute('SPEAKER_PHONE').catch((error: unknown) => {
          console.warn('Failed to choose speaker audio route:', error);
        });
    } catch (e) {
        console.warn('InCallManager start failed:', e);
    }
    
    return () => {
      try {
        InCallManager.setForceSpeakerphoneOn(false);
        InCallManager.setSpeakerphoneOn(false);
        InCallManager.stop();
      } catch (e) {}
    };
  }, []);

  // Re-assert speakerphone whenever WebRTC tracks change, because
  // getUserMedia / new consumers can reset the audio route to earpiece.
  useEffect(() => {
    if (tracksVersion > 0 && InCallManager) {
      try {
        console.log('[audio] re-asserting speakerphone after track change v' + tracksVersion);
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
      } catch (e) {
        console.warn('[audio] failed to re-assert speakerphone', e);
      }
    }
  }, [tracksVersion]);

  useEffect(() => {
    if (channels.length === 0) return;

    const selectedStillExists = channels.some((channel) => channel.id === selectedChannelId);
    if (!selectedChannelId || !selectedStillExists) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (!mediasoupSession.current && !mediasoupSessionLoad.current) {
      mediasoupSessionLoad.current = import('../services/mediasoup/WalkieTalkieSession')
        .then(({ default: WalkieTalkieSession }) => {
          mediasoupSession.current = new WalkieTalkieSession();
          mediasoupSession.current.setOnTracksUpdated(() => {
            setTracksVersion(v => v + 1);
          });
          setMediaSessionReady(true);

          if (socket) {
            mediasoupSession.current.setSocket(socket);
          }
        })
        .catch((error: unknown) => {
          console.warn('Failed to load mediasoup session module', error);
        })
        .finally(() => {
          mediasoupSessionLoad.current = null;
        });
      return;
    }

    if (socket) {
      mediasoupSession.current.setSocket(socket);
    }
  }, [socket]);

  useEffect(() => {
    if (connectionState !== 'connected' || sessionRestorePending) {
      mediasoupSession.current?.dispose();
      setMediasoupReady(false);
      return;
    }

    if (!mediaSessionReady || !room || !deviceId || !selectedChannelId || !socket) {
      setMediasoupReady(false);
      return;
    }

    if (!micPermissionGranted) {
      setMediasoupReady(false);
      return;
    }

    mediasoupSession.current?.initialize({
      roomId: room.id,
      channelId: selectedChannelId,
      deviceId
    }).then(() => {
      setMediasoupReady(true);
    }).catch((error: unknown) => {
      setMediasoupReady(false);
      console.warn('Failed to initialize mediasoup session', error);
    });
  }, [mediaSessionReady, micPermissionGranted, room?.id, selectedChannelId, deviceId, socket, connectionState]);

  // ── Poll connection quality every 5s ──
  useEffect(() => {
    if (!mediasoupReady || !mediasoupSession.current) {
      setSignalLevel(0);
      return;
    }

    const poll = async () => {
      try {
        const quality = await mediasoupSession.current?.getConnectionQuality();
        if (quality) {
          setSignalLevel(quality.level as SignalLevel);
        }
      } catch (e) {
        // silently ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [mediasoupReady]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const canRunService = !!room?.id && micPermissionGranted && notificationPermissionGranted;

    const syncForegroundService = async () => {
      if (backgroundServiceSyncingRef.current) {
        return;
      }

      backgroundServiceSyncingRef.current = true;

      try {
        if (!canRunService) {
          if (backgroundServiceActiveRef.current) {
            await BackgroundService.stopService();
            backgroundServiceActiveRef.current = false;
          }
          return;
        }

        const roomName = room?.id ?? 'UNKNOWN';
        const channelName = selectedChannelId || 'ALPHA';
        const speaker = mediasoupReady ? members.find((m) => m.id === activeSpeakerId) : null;

        if (!backgroundServiceActiveRef.current) {
          await BackgroundService.startService(
            roomName,
            channelName,
            mediasoupReady ? undefined : 'Connecting to live session...',
          );
          backgroundServiceActiveRef.current = true;
          return;
        }

        await BackgroundService.updateSpeakerStatus(
          roomName,
          channelName,
          speaker ? speaker.name : null,
        );
      } catch (error) {
        console.warn('[BackgroundService] Failed to sync foreground service:', error);
      } finally {
        backgroundServiceSyncingRef.current = false;
      }
    };

    void syncForegroundService();

    return () => {
      if (!canRunService && backgroundServiceActiveRef.current) {
        void BackgroundService.stopService();
        backgroundServiceActiveRef.current = false;
      }
    };
  }, [room?.id, selectedChannelId, micPermissionGranted, notificationPermissionGranted, mediasoupReady, activeSpeakerId, members]);

  // ── Debug Audio Connection ──
  useEffect(() => {
    if (!mediasoupReady || !mediasoupSession.current) return;
    
    const checkIce = async () => {
      try {
        const stats = await mediasoupSession.current.getStats();
        // Log the state of the send transport
        console.log('[RoomScreen] Audio ICE State:', stats.sendTransport?.iceState || 'unknown');
      } catch (e) {
        // ignore stats errors
      }
    };

    const interval = setInterval(checkIce, 3000);
    return () => clearInterval(interval);
  }, [mediasoupReady]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const requestWebRTCPermissions = async () => {
      try {
        const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        
        if (Number(Platform.Version) >= 33) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        
        if (Number(Platform.Version) >= 31) {
           permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
        
        const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const recordAudioGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const notificationsGranted =
          Number(Platform.Version) < 33 ||
          results[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;
        
        setMicPermissionGranted(recordAudioGranted);
        setNotificationPermissionGranted(notificationsGranted);
      } catch (error) {
        console.warn('Failed to request permissions', error);
      }
    };
    
    requestWebRTCPermissions();
  }, []);

  useEffect(() => {
    return () => {
      mediasoupSession.current?.dispose();
      mediasoupSession.current = null;
      if (Platform.OS === 'android' && backgroundServiceActiveRef.current) {
        void BackgroundService.stopService();
        backgroundServiceActiveRef.current = false;
      }
    };
  }, []);

  const currentIndex = channels.findIndex(ch => ch.id === selectedChannelId)
  const membersInChannel = selectedChannel?.members?.length ?? 0
  const totalMembers = members.length
  const activeSpeaker = useMemberById(activeSpeakerId)

  let talkState: 'idle' | 'ready' | 'speaking_self' | 'speaking_other' = 'idle';
  if (activeSpeakerId && activeSpeakerId === deviceId) {
    talkState = 'speaking_self';
  } else if (activeSpeakerId) {
    talkState = 'speaking_other';
  }

  const onMembersPress = () => {
    navigation.navigate('Members')
  }

  const onLeavePress = () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return
    socket.emit('leaveRoom', { deviceId, roomId: room.id, channelId: selectedChannelId })
    mediasoupSession.current?.releaseMicProducer()
    mediasoupSession.current?.dispose()
    if (Platform.OS === 'android' && backgroundServiceActiveRef.current) {
      void BackgroundService.stopService()
      backgroundServiceActiveRef.current = false
    }
    useAppStore.getState().clearSession()
    navigation.navigate('Entry')
  }

  const onSharePress = () => {
    setShowInviteModal(true);
    triggerHaptic('light');
  }

  const onAdminPress = () => {
    navigation.navigate('Admin');
    triggerHaptic('light');
  }

  const toggleMicSource = () => {
    const nextSource = micSource === 'phone' ? 'watch' : 'phone';
    setMicSource(nextSource);
    if (nextSource === 'phone') {
      mediasoupSession.current?.usePhoneMicSource();
    } else {
      mediasoupSession.current?.useWatchMicSource();
    }
    triggerHaptic('light');
  }

  const onTalkPressIn = async () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return;
    if (!mediasoupReady) {
      console.log('[ptt] ignored pressIn until mediasoup is ready');
      return;
    }
    if (pttInFlightRef.current) {
      console.log('[ptt] pressIn ignored, already in flight');
      return;
    }

    // Ensure phone mic is selected when pressing phone PTT
    mediasoupSession.current?.usePhoneMicSource();
    setMicSource('phone');

    pttHeldRef.current = true;
    pttInFlightRef.current = true;
    console.log('[ptt] pressIn create producer', room.id, selectedChannelId, deviceId);
    triggerHaptic('light');

    try {
      await mediasoupSession.current?.ensureMicProducer();
      if (!pttHeldRef.current) {
        console.log('[ptt] pressIn aborted, button released before producer was ready');
        return;
      }
      console.log('[ptt] mic producer ready, requesting mic grant');
      socket.emit('requestMic', { deviceId, roomId: room.id, channelId: selectedChannelId });
    } catch (error) {
      console.warn('[ptt] failed to prepare mic producer', error);
    } finally {
      pttInFlightRef.current = false;
    }
  }

  const onTalkPressOut = () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return;
    pttHeldRef.current = false;
    console.log('[ptt] pressOut releaseMic', room.id, selectedChannelId, deviceId);
    triggerHaptic('light');
    socket.emit('releaseMic', { deviceId, roomId: room.id, channelId: selectedChannelId });
    mediasoupSession.current?.releaseMicProducer();
  }

  const onPrevChannel = () => {
    if (channels.length === 0 || !socket || !deviceId || !room) return;
    const idx = channels.findIndex(ch => ch.id === selectedChannelId);
    const prevIdx = idx <= 0 ? channels.length - 1 : idx - 1;
    const prevChannelId = channels[prevIdx].id;
    socket.emit('leaveChannel', { deviceId, roomId: room.id, channelId: selectedChannelId });
    socket.emit('joinChannel', { deviceId, roomId: room.id, channelId: prevChannelId });
    setSelectedChannelId(prevChannelId);
  }
  
  const onNextChannel = () => {
    if (channels.length === 0 || !socket || !deviceId || !room) return
    const idx = channels.findIndex(ch => ch.id === selectedChannelId)
    const nextIdx = idx === -1 || idx === channels.length - 1 ? 0 : idx + 1
    socket.emit('leaveChannel', { deviceId, roomId: room.id, channelId: selectedChannelId });
    socket.emit("joinChannel", { deviceId, roomId: room.id, channelId: channels[nextIdx].id })
    setSelectedChannelId(channels[nextIdx].id)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>

      <View className="flex-1 relative">
        <RoomHeader 
          roomName={room?.id ?? 'Loading...'} 
          connectionState={connectionState} 
          onSharePress={onSharePress}
          onAdminPress={isAdmin ? onAdminPress : undefined}
          signalLevel={signalLevel}
        />

        {notice && (
          <SystemBanner
            notice={notice}
            onDismiss={() => setNotice(null)}
          />
        )}

        <ActivityToast toasts={activityToasts} onExpire={removeActivityToast} />
        
        <InviteModal 
          isVisible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomId={room?.id ?? ''}
        />
        
        {mediasoupSession.current?.getLocalStream() && (
          <RTCView 
            streamURL={mediasoupSession.current.getLocalStream().toURL()} 
            style={{ width: 0, height: 0, display: 'none' }} 
          />
        )}
        {mediasoupSession.current?.getRemoteStreams().map((stream: any) => (
          <RTCView 
            key={stream.id} 
            streamURL={stream.toURL()} 
            style={{ width: 0, height: 0, display: 'none' }} 
          />
        ))}

        <View className="flex-1 flex-col items-center pt-6 pb-48">
          <View style={{ flex: 0.2 }} />

          <SpeakerArea 
            speakerName={activeSpeaker?.name ?? null} 
            isActive={talkState === 'speaking_other' || talkState === 'speaking_self'} 
          />

          <View style={{ flex: 0.4 }} />

          <ChannelSelector 
            channelName={selectedChannel?.name ?? 'Connecting...'}
            currentIndex={currentIndex !== -1 ? currentIndex : 0}
            totalChannels={channels.length || 1}
            onPrev={onPrevChannel}
            onNext={onNextChannel}
            isActive={talkState !== 'idle'}
          />

          <View style={{ flex: 1 }} />
        </View>

        {/* Absolute Bottom Elements */}
        <PushToTalkButton state={talkState} onPressIn={onTalkPressIn} onPressOut={onTalkPressOut} />
        
        <BottomControls
          memberChannelCount={membersInChannel}
          totalMemberCount={totalMembers}
          onMembersPress={onMembersPress}
          onLeavePress={onLeavePress}
          volume={volume}
          onVolumeChange={setVolume}
          micSource={micSource}
        />
      </View>
    </SafeAreaView>
  )
}

export default RoomScreen
