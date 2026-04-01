import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { ConnectionState, RoomHeaderProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const statusDot: Record<ConnectionState, string> = {
  connected: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]',
  reconnecting: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]',
  disconnected: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
}

export interface ExtendedRoomHeaderProps extends RoomHeaderProps {
  onSharePress?: () => void;
}

const RoomHeader: React.FC<ExtendedRoomHeaderProps> = ({ roomName, connectionState, onSharePress }) => {
  return (
    <View className="flex-row items-center justify-between px-aura-xl py-aura-lg bg-surface/90 border-b border-aura-border z-30 w-full pt-12 shadow-lg backdrop-blur-md">
      {/* Title & Connection Dot */}
      <View className="flex-row items-center">
        <View>
          <Text className="text-aura-xl font-extrabold text-white tracking-[4px] uppercase">{roomName}</Text>
          <View className="flex-row items-center mt-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${statusDot[connectionState]}`} />
            <Text className="text-[10px] text-aura-muted uppercase tracking-widest font-bold">
              #{roomName?.toLowerCase().replace(/\s+/g, '')}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center space-x-3">
        {onSharePress && (
          <TouchableOpacity 
            onPress={onSharePress}
            activeOpacity={0.6}
            className="w-10 h-10 rounded-full bg-surface-light border border-aura-border items-center justify-center"
          >
            <Icon name="share-2" size={18} color="#A78BFA" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default RoomHeader
