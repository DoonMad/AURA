import React from 'react'
import { View, Text } from 'react-native'
import type { RotaryDialProps, ChannelState } from '../types'

const colorMap: Record<ChannelState, string> = {
  free: 'bg-green-400',
  speaking: 'bg-red-500',
  idle: 'bg-gray-400',
}

const RotaryDial: React.FC<RotaryDialProps> = ({ channels, currentChannelId }) => {
  const radius = 110
  const angleStep = (2 * Math.PI) / channels.length

  return (
    <View className="items-center justify-center mb-aura-6">
      <View className="w-[240px] h-[240px] bg-surface rounded-full border border-aura-muted items-center justify-center relative">
        {channels.map((channel, idx) => {
          const angle = idx * angleStep
          const x = radius * Math.cos(angle)
          const y = radius * Math.sin(angle)
          return (
            <View
              key={channel.id}
              className={`absolute w-11 h-11 rounded-full border border-aura-700 ${colorMap[channel.state]} items-center justify-center ${channel.id === currentChannelId ? 'ring-2 ring-primary' : ''}`}
              style={{
                left: 120 + x - 22,
                top: 120 + y - 22,
              }}
            >
              <Text className="text-[10px] text-black font-bold">{channel.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )
        })}
      </View>
      <View className="absolute top-30 left-[50%] ml-2 h-6 w-6 bg-primary rounded-full" />
    </View>
  )
}

export default RotaryDial
