import React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import type { TalkState, PushToTalkButtonProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const statusMap: Record<TalkState, { main: string; glow: string; icon: string; text: string; label: string }> = {
  idle: {
    main: 'bg-surface-light border-aura-border',
    glow: 'shadow-none',
    icon: '#8B8A93',
    text: 'text-aura-muted',
    label: 'READY' // Using READY as the neutral state since "Gray" means idle/no one is speaking
  },
  ready: {
    main: 'bg-surface-light border-aura-border',
    glow: 'shadow-none',
    icon: '#8B8A93',
    text: 'text-aura-muted',
    label: 'READY'
  },
  speaking_self: {
    main: 'bg-green-500 border-green-400',
    glow: 'shadow-lg shadow-green-400',
    icon: '#FFFFFF',
    text: 'text-green-400',
    label: 'TRANSMITTING'
  },
  speaking_other: {
    main: 'bg-red-500 border-red-400',
    glow: 'shadow-md shadow-red-500',
    icon: '#FFFFFF',
    text: 'text-red-400',
    label: 'RECEIVING'
  },
}

const iconMap: Record<TalkState, string> = {
  idle: 'mic',
  ready: 'mic',
  speaking_self: 'radio',
  speaking_other: 'headphones',
}

const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({ state, onPressIn, onPressOut }) => {
  const isBusy = state === 'speaking_other';
  const config = statusMap[state];

  return (
    <View className="absolute bottom-16 self-center items-center z-30">
      <Text className={`text-[11px] font-black uppercase tracking-[4px] mb-4 z-10 ${config.text}`}>
        {config.label}
      </Text>
      
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut} 
        disabled={isBusy}
        activeOpacity={0.8}
        className={`w-32 h-32 rounded-full items-center justify-center border-2 ${config.main} z-10 ${config.glow} transition-transform duration-200 ${state === 'speaking_self' ? 'scale-105' : ''}`}
      >
        <Icon name={iconMap[state]} size={42} color={config.icon} />
      </TouchableOpacity>
    </View>
  )
}

export default PushToTalkButton
