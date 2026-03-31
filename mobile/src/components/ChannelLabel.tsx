import { View, Text } from 'react-native'
import React from 'react'
import type { ChannelLabelProps } from '../types'

const ChannelLabel: React.FC<ChannelLabelProps> = ({ channelName }) => (
  <View className="items-center my-aura-4">
    <Text className="text-aura-xl text-aura-text font-bold">Channel</Text>
    <Text className="text-aura-4xl text-primary font-extrabold mt-aura-2">{channelName}</Text>
  </View>
)

export default ChannelLabel
