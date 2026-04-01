import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RoomHeader from '../components/RoomHeader'
import SpeakerArea from '../components/SpeakerArea'
import PushToTalkButton from '../components/PushToTalkButton'
import BottomControls from '../components/BottomControls'
import ChannelSelector from '../components/ChannelSelector'
import type { Channel, DialChannel, RoomScreenProps, ChannelState } from '../types'

const RoomScreen: React.FC<RoomScreenProps> = ({ route }) => {
  const { room, members } = route.params

  const [roomName, setRoomName] = useState(room.id)
  const [channels, setChannels] = useState<DialChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | undefined>(undefined)
  const [talkState, setTalkState] = useState<'idle' | 'ready' | 'speaking_self' | 'speaking_other'>('idle')
  const [totalMembers, setTotalMembers] = useState(members.length)
  const [volume, setVolume] = useState(0.5)
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')
  const [membersInChannel, setMembersInChannel] = useState(0)

  useEffect(() => {
    const dialChannels: DialChannel[] = Object.values(room.channels).map((channel: Channel) => ({
      id: channel.id,
      name: channel.name,
      state: channel.activeSpeaker ? 'speaking' : (channel.members.length > 0 ? 'idle' : 'free') as ChannelState
    }));
    setChannels(dialChannels);
    if (dialChannels.length > 0 && selectedChannelId === '') {
      setSelectedChannelId(dialChannels[0].id);
    }
  }, [room.channels, selectedChannelId]);

  const onMembersPress = () => {
    // TODO: Navigate to members screen
  }

  const onLeavePress = () => {
    // TODO: Implement
  }

  const onSharePress = () => {
    console.log('Share room:', room.id)
    // TODO: open share sheet with room link or code
  }

  const onTalkPress = () => {
    setTalkState(prev => prev === 'idle' ? 'ready' : (prev === 'ready' ? 'speaking_self' : 'idle'))
  }

  const onPrevChannel = () => {
    if (channels.length === 0) return
    const idx = channels.findIndex(ch => ch.id === selectedChannelId)
    const prevIdx = idx <= 0 ? channels.length - 1 : idx - 1
    setSelectedChannelId(channels[prevIdx].id)
  }

  const onNextChannel = () => {
    if (channels.length === 0) return
    const idx = channels.findIndex(ch => ch.id === selectedChannelId)
    const nextIdx = idx === -1 || idx === channels.length - 1 ? 0 : idx + 1
    setSelectedChannelId(channels[nextIdx].id)
  }

  const selectedChannel = channels?.find((c) => c.id === selectedChannelId)
  const currentIndex = channels.findIndex(ch => ch.id === selectedChannelId)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>

      <View className="flex-1 relative">
        {/* Header - Stays glued to top */}
        <RoomHeader 
          roomName={roomName} 
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
            speakerName={selectedSpeaker} 
            isActive={talkState === 'speaking_other' || talkState === 'speaking_self'} 
          />

          {/* Bottom spacer to pad against the PTT button absolute area */}
          <View style={{ flex: 1 }} />
        </View>

        {/* Absolute Bottom Elements */}
        <PushToTalkButton state={talkState} onPress={onTalkPress} />
        
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