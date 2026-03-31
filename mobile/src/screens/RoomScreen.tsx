import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import RoomHeader from '../components/RoomHeader'
import RotaryDial from '../components/RotaryDial'
import ChannelLabel from '../components/ChannelLabel'
import SpeakerArea from '../components/SpeakerArea'
import PushToTalkButton from '../components/PushToTalkButton'
import BottomControls from '../components/BottomControls'
import type { DialChannel, RoomScreenProps } from '../types'

const RoomScreen: React.FC<RoomScreenProps> = ({ route }) => {
  const { roomId } = route.params

  const [roomName, setRoomName] = useState(roomId)
  const [channels, setChannels] = useState<DialChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | undefined>(undefined)
  const [talkState, setTalkState] = useState<'idle' | 'ready' | 'speaking_self' | 'speaking_other'>('idle')
  const [totalMembers, setTotalMembers] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting' | 'disconnected'>('reconnecting')
  const [membersInChannel, setMembersInChannel] = useState(0)

  const onMembersPress = () => {
    // TODO: Implement
  }

  const onLeavePress = () => {
    // TODO: Implement
  }

  const onSharePress = () => {
    // TODO: Implement
  }

  const onTalkPress = () => {
    // TODO: Implement
  }

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  return (
    <ScrollView className="flex-1 bg-background p-aura-3">
      <RoomHeader roomName={roomName} connectionState={connectionState} />
      <RotaryDial channels={channels} currentChannelId={selectedChannelId} />
      <ChannelLabel channelName={selectedChannel?.name ?? 'Unknown'} />
      <SpeakerArea speakerName={selectedSpeaker} />
      <PushToTalkButton state={talkState} onPress={onTalkPress} />
      <BottomControls
        memberChannelCount={membersInChannel}
        totalMemberCount={totalMembers}
        onMembersPress={onMembersPress}
        onLeavePress={onLeavePress}
        onSharePress={onSharePress}
        volume={volume}
      />
    </ScrollView>
  )
}

export default RoomScreen