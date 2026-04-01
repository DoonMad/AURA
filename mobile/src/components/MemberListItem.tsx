import React from 'react'
import { View, Text } from 'react-native'
import type { MemberListItemProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const getInitials = (name: string) => {
  return name.substring(0, 2).toUpperCase();
}

const MemberListItem: React.FC<MemberListItemProps> = ({ name, isSpeaking = false }) => {
  return (
    <View className={`flex-row justify-between items-center bg-surface rounded-xl p-4 mb-3 border ${isSpeaking ? 'border-primary/50 bg-primary/10' : 'border-aura-border'}`}>
      
      {/* Avatar & Info */}
      <View className="flex-row items-center">
        {/* Avatar Circle */}
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 
          ${isSpeaking ? 'bg-primary shadow-[0_0_15px_rgba(124,92,252,0.4)]' : 'bg-surface-light border border-aura-border'}`}>
          <Text className={`font-black text-lg ${isSpeaking ? 'text-white' : 'text-aura-muted'}`}>
            {getInitials(name)}
          </Text>
        </View>

        {/* Name and Basic Details */}
        <View>
          <Text className={`text-base font-bold ${isSpeaking ? 'text-white' : 'text-aura-text'}`}>{name}</Text>
          <Text className={`text-xs mt-1 ${isSpeaking ? 'text-primary-light font-semibold' : 'text-aura-muted'}`}>
            {isSpeaking ? 'Transmitting...' : 'Connected'}
          </Text>
        </View>
      </View>

      {/* State Indicators */}
      <View>
        {isSpeaking ? (
          <View className="flex-row space-x-1 items-end mr-2">
            <View className="w-1 h-3 bg-primary rounded-full" />
            <View className="w-1 h-5 bg-primary rounded-full" />
            <View className="w-1 h-2 bg-primary rounded-full" />
            <View className="w-1 h-4 bg-primary rounded-full" />
          </View>
        ) : (
          <Icon name="mic-off" size={18} color="#8B8A93" />
        )}
      </View>

    </View>
  )
}

export default MemberListItem
