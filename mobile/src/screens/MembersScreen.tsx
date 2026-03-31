import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import MemberListItem from '../components/MemberListItem'
import type { MembersScreenProps } from '../types'

const MembersScreen: React.FC<MembersScreenProps> = ({
  currentChannelMembers,
  allMembers,
  showAdminControls = false,
  onCreateChannel,
  onRenameChannel,
}) => {
  return (
    <ScrollView className="flex-1 bg-background p-aura-3">
      <Text className="text-aura-2xl text-aura-text font-bold mb-aura-3">Members</Text>

      {showAdminControls && (
        <View className="bg-surface rounded-aura-xl p-aura-3 mb-aura-4">
          <Text className="text-aura-sm text-aura-muted mb-aura-2">Admin Controls</Text>
          <View className="flex-row justify-between">
            <Text className="text-primary font-semibold" onPress={onCreateChannel}>Create Channel</Text>
            <Text className="text-primary font-semibold" onPress={onRenameChannel}>Rename Channel</Text>
          </View>
        </View>
      )}

      <Text className="text-aura-lg text-aura-text font-bold mb-aura-2">Current Channel</Text>
      {currentChannelMembers.map((member) => (
        <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
      ))}

      <Text className="text-aura-lg text-aura-text font-bold mt-aura-4 mb-aura-2">All Room Members</Text>
      {allMembers.map((member) => (
        <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
      ))}
    </ScrollView>
  )
}

export default MembersScreen
