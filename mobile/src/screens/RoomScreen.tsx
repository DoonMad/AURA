import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PermissionsAndroid, Platform, Text, View } from 'react-native'
// @ts-ignore
import { RTCView } from 'react-native-webrtc'
import { SafeAreaView } from 'react-native-safe-area-context'
import InCallManager from 'react-native-incall-manager'
import RoomHeader from '../components/RoomHeader'
import SpeakerArea from '../components/SpeakerArea'
import PushToTalkButton from '../components/PushToTalkButton'
import BottomControls from '../components/BottomControls'
import ChannelSelector from '../components/ChannelSelector'
import type { RoomScreenProps } from '../types'
import useAppStore, { useMemberById, useMembersArray } from '../store/useAppStore'
import { BACKEND_HOST } from '../config/network'

const RoomScreen: React.FC<RoomScreenProps> = ({ navigation }) => {
  // ── Read from the global store (no more route.params!) ──
  const room = useAppStore((s) => s.room)
  const socket = useAppStore((s) => s.socket)
  const deviceId = useAppStore((s) => s.deviceId)
  const members = useMembersArray()
  const mediasoupSession = useRef<any>(null)
  const mediasoupSessionLoad = useRef<Promise<void> | null>(null)
  const pttInFlightRef = useRef(false)
  const pttHeldRef = useRef(false)
  const [mediaSessionReady, setMediaSessionReady] = useState(false)
  const [mediasoupReady, setMediasoupReady] = useState(false)
  const [tracksVersion, setTracksVersion] = useState(0)
 

  // ── Local UI state ──
  const channels = useMemo(() => (room ? Object.values(room.channels) : []), [room])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')

  const [volume, setVolume] = useState(0.5)
  const connectionState: 'connected' | 'reconnecting' | 'disconnected' = 'connected'
  const [micPermissionGranted, setMicPermissionGranted] = useState(Platform.OS !== 'android')

  // Listen for real-time room updates from the backend
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

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('micStateUpdated', handleMicStateUpdated);
    socket.on('roomLeft', handleRoomLeft);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('micStateUpdated', handleMicStateUpdated);
      socket.off('roomLeft', handleRoomLeft);
    };
  }, [socket, navigation]);

  // Route audio to main speaker, not earpiece
  useEffect(() => {
    // 'video' mode defaults to loudspeaker; 'audio' defaults to earpiece
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    return () => {
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.stop();
    };
  }, []);

  // Default channel if none selected
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
        if (Platform.Version >= 31) {
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

  // ── Derived state ──
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

  // ── Handlers ──
  const onMembersPress = () => {
    // No params needed — MembersScreen reads from the store
    navigation.navigate('Members')
  }

  const onLeavePress = () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return
    socket.emit('leaveRoom', { deviceId, roomId: room.id, channelId: selectedChannelId })
    mediasoupSession.current?.dispose()
    useAppStore.getState().clearSession()
    navigation.navigate('Entry')
  }

  const onSharePress = () => {
    if (room) console.log('Share room:', room.id)
    // TODO: open share sheet with room link or code
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
  }

  const onPrevChannel = () => {
    if (channels.length === 0 || !socket || !deviceId || !room) return
    const idx = channels.findIndex(ch => ch.id === selectedChannelId)
    const prevIdx = idx <= 0 ? channels.length - 1 : idx - 1
    socket.emit("leaveChannel", { deviceId, roomId: room.id, channelId: selectedChannelId })
    setSelectedChannelId(channels[prevIdx].id)
  }

  const onNextChannel = () => {
    if (channels.length === 0 || !socket || !deviceId || !room) return
    const idx = channels.findIndex(ch => ch.id === selectedChannelId)
    const nextIdx = idx === -1 || idx === channels.length - 1 ? 0 : idx + 1
    socket.emit("joinChannel", { deviceId, roomId: room.id, channelId: channels[nextIdx].id })
    setSelectedChannelId(channels[nextIdx].id)
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>

      <View className="flex-1 relative">
        {/* Header - Stays glued to top */}
        <RoomHeader 
          roomName={room?.id ?? 'Loading...'} 
          connectionState={connectionState} 
          onSharePress={onSharePress} 
        />
        <View className="absolute top-20 right-4 z-20 rounded-full bg-black/40 px-3 py-2">
          <Text className="text-[10px] font-bold uppercase tracking-[2px] text-white">
            {BACKEND_HOST}
          </Text>
        </View>
        
        {/* Hidden RTCViews to keep the WebRTC C++ Media Engine from suspending audio tracks */}
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

        {/* Main Content Area - Distributes elements cleanly using flex space-between */}
        <View className="flex-1 flex-col justify-around items-center pt-8 pb-48">
          
          {/* Top Half Spacer: Pushes the channel selector slightly down */}
          <View style={{ flex: 0.5 }} />

          <ChannelSelector 
            channelName={selectedChannel?.name ?? 'Connecting...'}
            currentIndex={currentIndex !== -1 ? currentIndex : 0}
            totalChannels={channels.length || 1}
            onPrev={onPrevChannel}
            onNext={onNextChannel}
            isActive={talkState !== 'idle'}
          />

          {/* Middle Spacer */}
          <View style={{ flex: 1.5 }} />

          <SpeakerArea 
            speakerName={activeSpeaker?.name ?? null} 
            isActive={talkState === 'speaking_other' || talkState === 'speaking_self'} 
          />

          {/* Bottom spacer to pad against the PTT button absolute area */}
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
