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
import type { RoomScreenProps } from '../types'
import useAppStore, { useMemberById, useMembersArray } from '../store/useAppStore'
import { BACKEND_HOST } from '../config/network'

const RoomScreen: React.FC<RoomScreenProps> = ({ navigation }) => {
  const room = useAppStore((s) => s.room)
  const socket = useAppStore((s) => s.socket)
  const deviceId = useAppStore((s) => s.deviceId)
  const notice = useAppStore((s) => s.notice)
  const setNotice = useAppStore((s) => s.setNotice)
  const members = useMembersArray()
  const mediasoupSession = useRef<any>(null)
  const mediasoupSessionLoad = useRef<Promise<void> | null>(null)
  const pttInFlightRef = useRef(false)
  const pttHeldRef = useRef(false)
  const [mediaSessionReady, setMediaSessionReady] = useState(false)
  const [mediasoupReady, setMediasoupReady] = useState(false)
  const [tracksVersion, setTracksVersion] = useState(0)

  const channels = useMemo(() => (room ? Object.values(room.channels) : []), [room])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [volume, setVolume] = useState(0.5)
  const connectionState: 'connected' | 'reconnecting' | 'disconnected' = 'connected'
  const [micPermissionGranted, setMicPermissionGranted] = useState(Platform.OS !== 'android')

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (data: { room: any; users: any[] }) => {
      if (!data?.room || !Array.isArray(data.users)) return;
      console.log('[room] roomUpdated', data.room.id, data.users.length);

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

    const handleRoomLeft = () => {
      console.log('[room] roomLeft received');
      mediasoupSession.current?.dispose();
      useAppStore.getState().clearSession();
      navigation.navigate('Entry');
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
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('micStateUpdated', handleMicStateUpdated);
    socket.on('roomLeft', handleRoomLeft);
    socket.on('micDenied', handleMicDenied);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('micStateUpdated', handleMicStateUpdated);
      socket.off('roomLeft', handleRoomLeft);
      socket.off('micDenied', handleMicDenied);
    };
  }, [socket, navigation]);

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
  }, [mediaSessionReady, micPermissionGranted, room?.id, selectedChannelId, deviceId, socket]);

  useEffect(() => {
    if (Platform.OS !== 'android' || micPermissionGranted) {
      return;
    }

    const requestWebRTCPermissions = async () => {
      try {
        const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (Number(Platform.Version) >= 31) {
           permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }
        
        const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const recordAudioGranted = results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        setMicPermissionGranted(recordAudioGranted);
      } catch (error) {
        console.warn('Failed to request permissions', error);
      }
    };
    requestWebRTCPermissions();
  }, [micPermissionGranted]);

  useEffect(() => {
    return () => {
      mediasoupSession.current?.dispose();
      mediasoupSession.current = null;
    };
  }, []);

  const selectedChannel = channels?.find((c) => c.id === selectedChannelId)
  const currentIndex = channels.findIndex(ch => ch.id === selectedChannelId)

  const membersInChannel = selectedChannel?.members?.length ?? 0
  const totalMembers = members.length

  const activeSpeakerId = selectedChannel?.activeSpeaker
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
    useAppStore.getState().clearSession()
    navigation.navigate('Entry')
  }

  const onSharePress = async () => {
    if (!room) return;
    try {
      const url = `${BACKEND_HOST}/room/${room.id}`;
      const result = await Share.share({
        message: `Join my AURA room: ${url}`,
        title: 'AURA Room Invite',
        url,
      });
      console.log('Share result', result);
    } catch (error) {
      console.warn('Share failed', error);
    }
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

    pttHeldRef.current = true;
    pttInFlightRef.current = true;
    console.log('[ptt] pressIn create producer', room.id, selectedChannelId, deviceId);

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
        />

        {notice && (
          <SystemBanner
            notice={notice}
            onDismiss={() => setNotice(null)}
          />
        )}
        
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
        />
      </View>
    </SafeAreaView>
  )
}

export default RoomScreen
