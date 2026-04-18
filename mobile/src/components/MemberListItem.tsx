import React from 'react'
import { View, Text } from 'react-native'
import type { MemberListItemProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
}

const MemberListItem: React.FC<MemberListItemProps> = ({ name, isSpeaking = false }) => {
  return (
    <View className={`flex-row justify-between items-center bg-surface-lighter rounded-xl p-4 mb-3 border ${isSpeaking ? 'border-aura-active bg-aura-active/10' : 'border-aura-border'}`}>
      
      {/* Avatar & Info */}
      <View className="flex-row items-center">
        {/* Avatar Circle */}
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 
          ${isSpeaking ? 'bg-aura-active shadow-glow-active' : 'bg-surface border border-aura-border'}`}>
          <Text className={`font-black text-lg ${isSpeaking ? 'text-background' : 'text-aura-muted'}`}>
            {getInitials(name)}
          </Text>
        </View>

        {/* Name and Basic Details */}
        <View>
          <Text className={`text-base font-black tracking-wide ${isSpeaking ? 'text-white' : 'text-aura-text'}`}>{name}</Text>
          <Text className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${isSpeaking ? 'text-aura-active' : 'text-aura-muted'}`}>
            {isSpeaking ? 'Speaking...' : 'Connected'}
          </Text>
        </View>
      </View>

      {/* State Indicators */}
      <View>
        {isSpeaking ? (
          <View className="flex-row space-x-1 items-end mr-2 h-6 justify-center">
            <View className="w-1.5 h-3 bg-aura-active rounded-full" />
            <View className="w-1.5 h-5 bg-aura-active rounded-full" />
            <View className="w-1.5 h-2 bg-aura-active rounded-full" />
            <View className="w-1.5 h-4 bg-aura-active rounded-full" />
          </View>
        ) : (
          <View className="w-8 h-8 rounded-full bg-surface items-center justify-center border border-aura-border">
            <Icon name="mic-off" size={14} color="#71717A" />
          </View>
        )}
      </View>

    </View>
  )
}

export default MemberListItem
