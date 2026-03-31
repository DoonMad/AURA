import React from 'react'
import { View, Text } from 'react-native'
import type { ConnectionState, RoomHeaderProps } from '../types'

const statusStyles: Record<ConnectionState, string> = {
  connected: 'text-green-400 bg-green-900',
  reconnecting: 'text-yellow-300 bg-yellow-900',
  disconnected: 'text-red-400 bg-red-900',
}

const statusLabel: Record<ConnectionState, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomName, connectionState }) => {
  return (
    <View className="flex-row items-center justify-between px-aura-lg py-aura-sm bg-surface rounded-aura-xl mb-aura-md">
      <View>
        <Text className="text-aura-2xl font-extrabold text-aura-text">{roomName}</Text>
        <Text className="text-aura-sm text-aura-muted mt-aura-1">Room ID: #{roomName.toLowerCase().replace(/\s+/g, '')}</Text>
      </View>
      <View className={`px-aura-2 py-aura-1 rounded-aura-md ${statusStyles[connectionState]}`}>
        <Text className="text-xs font-semibold uppercase">{statusLabel[connectionState]}</Text>
      </View>
    </View>
  )
}

export default RoomHeader
