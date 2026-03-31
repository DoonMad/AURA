import React from 'react'
import { View, Text } from 'react-native'
import type { SpeakerAreaProps } from '../types'

const SpeakerArea: React.FC<SpeakerAreaProps> = ({ speakerName, isActive = false }) => {
  return (
    <View className="bg-surface rounded-aura-xl p-aura-md mb-aura-4">
      <Text className="text-aura-sm text-aura-muted">Activity</Text>
      <Text className="text-aura-2xl text-aura-text font-bold mt-aura-2">
        {speakerName ? speakerName : 'No activity'}
      </Text>
      <View className="h-5 mt-aura-3 bg-gradient-to-r from-primary via-surface to-primary/40 rounded-full" />
      <View className="h-2 w-full bg-aura-muted/40 mt-aura-2 rounded-full" />
    </View>
  )
}

export default SpeakerArea
