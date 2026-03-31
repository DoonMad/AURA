import React from 'react'
import { View, Text } from 'react-native'
import type { MemberListItemProps } from '../types'

const MemberListItem: React.FC<MemberListItemProps> = ({ name, isSpeaking = false }) => {
  return (
    <View className="flex-row justify-between items-center bg-surface rounded-aura-lg p-aura-3 mb-aura-2">
      <Text className="text-aura-base text-white">{name}</Text>
      {isSpeaking ? <Text className="text-xs text-green-300">Speaking</Text> : <Text className="text-xs text-aura-muted">Idle</Text>}
    </View>
  )
}

export default MemberListItem
