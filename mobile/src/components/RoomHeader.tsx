import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { ConnectionState, RoomHeaderProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'
import SignalBars from './SignalBars'
import type { SignalLevel } from './SignalBars'

const statusDot: Record<ConnectionState, string> = {
  connected: 'bg-aura-active',
  reconnecting: 'bg-aura-standby',
  disconnected: 'bg-aura-danger',
}

const statusLabel: Record<ConnectionState, string> = {
  connected: 'CONNECTED',
  reconnecting: 'RECONNECTING',
  disconnected: 'OFFLINE',
}

export interface ExtendedRoomHeaderProps extends RoomHeaderProps {
  onSharePress?: () => void;
  onAdminPress?: () => void;
  signalLevel?: SignalLevel;
}

const RoomHeader: React.FC<ExtendedRoomHeaderProps> = ({ roomName, connectionState, onSharePress, onAdminPress, signalLevel = 0 }) => {
  const roomLabel = typeof roomName === 'string' ? roomName : 'loading';

  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-surface/95 border-b border-aura-border z-30 w-full pt-5 shadow-lg">
      {/* Title & Connection Dot */}
      <View className="flex-row items-center flex-1">
        <View className="flex-1">
          <Text className="text-2xl font-black text-primary tracking-[4px] uppercase">{roomName}</Text>
          <View className="flex-row items-center mt-1">
            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${statusDot[connectionState]}`} />
            <Text className="text-[10px] text-aura-muted uppercase tracking-[3px] font-bold">
              {statusLabel[connectionState]} · Room ID: {roomLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center space-x-3">
        {connectionState === 'connected' && (
          <View className="mr-2">
            <SignalBars level={signalLevel} />
          </View>
        )}
        {onSharePress && (
          <TouchableOpacity 
            onPress={onSharePress}
            activeOpacity={0.6}
            className="w-10 h-10 rounded-full bg-surface-lighter border border-aura-border items-center justify-center"
          >
            <Icon name="share-2" size={16} color="#FAFAFA" />
          </TouchableOpacity>
        )}
        {onAdminPress && (
          <TouchableOpacity 
            onPress={onAdminPress}
            activeOpacity={0.6}
            className="w-10 h-10 rounded-full bg-surface-lighter border border-aura-border items-center justify-center"
          >
            <Icon name="settings" size={16} color="#FAFAFA" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default RoomHeader
