import React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import type { TalkState, PushToTalkButtonProps } from '../types'

const colorMap: Record<TalkState, string> = {
  idle: 'bg-gray-500',
  ready: 'bg-green-500',
  speaking_self: 'bg-blue-500',
  speaking_other: 'bg-red-500',
}

const labelMap: Record<TalkState, string> = {
  idle: 'Hold to Talk',
  ready: 'Ready',
  speaking_self: 'Talking',
  speaking_other: 'Busy',
}

const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({ state, onPress }) => {
  return (
    <View className="items-center justify-center mt-aura-3 mb-aura-4">
      <TouchableOpacity
        onPress={onPress}
        className={`w-40 h-40 rounded-full items-center justify-center ${colorMap[state]}`}
      >
        <Text className="text-white text-xl font-bold">{labelMap[state]}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default PushToTalkButton
