import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RoomHeader from '../components/RoomHeader'
import SpeakerArea from '../components/SpeakerArea'
import PushToTalkButton from '../components/PushToTalkButton'
import BottomControls from '../components/BottomControls'
import ChannelSelector from '../components/ChannelSelector'
import type { RoomScreenProps } from '../types'
import useAppStore, { useMemberById, useMembersArray } from '../store/useAppStore'

const RoomScreen: React.FC<RoomScreenProps> = ({ navigation }) => {
  // ── Read from the global store (no more route.params!) ──
  const room = useAppStore((s) => s.room)
  const socket = useAppStore((s) => s.socket)
  const deviceId = useAppStore((s) => s.deviceId)
  const members = useMembersArray()
 

  // ── Local UI state ──
  const channels = room ? Object.values(room.channels) : []
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')

  const [volume, setVolume] = useState(0.5)
  const connectionState: 'connected' | 'reconnecting' | 'disconnected' = 'connected'

  // Listen for real-time room updates from the backend
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (data: { room: any; users: any[] }) => {
      if (!data?.room || !Array.isArray(data.users)) return;

      useAppStore.getState().setRoom(data.room);
      useAppStore.getState().setMembers(data.users);
    };

    const handleRoomLeft = () => {
      useAppStore.getState().clearSession();
      navigation.navigate('Entry');
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomLeft', handleRoomLeft);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomLeft', handleRoomLeft);
    };
  }, [socket, navigation]);

  // Default channel if none selected
  useEffect(() => {
    if (channels.length === 0) return;

    const selectedStillExists = channels.some((channel) => channel.id === selectedChannelId);
    if (!selectedChannelId || !selectedStillExists) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

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
    useAppStore.getState().clearSession()
    navigation.navigate('Entry')
  }

  const onSharePress = () => {
    if (room) console.log('Share room:', room.id)
    // TODO: open share sheet with room link or code
  }

  const onTalkPressIn = () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return;
    socket.emit('requestMic', { deviceId, roomId: room.id, channelId: selectedChannelId });
  }

  const onTalkPressOut = () => {
    if (!socket || !room || !deviceId || !selectedChannelId) return;
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
