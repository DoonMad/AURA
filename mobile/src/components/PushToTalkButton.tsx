import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View, type ViewStyle } from 'react-native'
import type { TalkState, PushToTalkButtonProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const styles = StyleSheet.create({
  idleScale: {
    transform: [{ scale: 1 }],
  },
  activeScale: {
    transform: [{ scale: 1.05 }],
  },
  greenGlow: {
    shadowColor: '#4ade80',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  redGlow: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});

const statusMap: Record<TalkState, { main: string; icon: string; text: string; label: string; shadow?: ViewStyle }> = {
  idle: {
    main: 'bg-surface-light border-aura-border',
    icon: '#8B8A93',
    text: 'text-aura-muted',
    label: 'READY' // Using READY as the neutral state since "Gray" means idle/no one is speaking
  },
  ready: {
    main: 'bg-surface-light border-aura-border',
    icon: '#8B8A93',
    text: 'text-aura-muted',
    label: 'READY'
  },
  speaking_self: {
    main: 'bg-green-500 border-green-400',
    icon: '#FFFFFF',
    text: 'text-green-400',
    label: 'TRANSMITTING',
    shadow: styles.greenGlow
  },
  speaking_other: {
    main: 'bg-red-500 border-red-400',
    icon: '#FFFFFF',
    text: 'text-red-400',
    label: 'RECEIVING',
    shadow: styles.redGlow
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
        className={`w-32 h-32 rounded-full items-center justify-center border-2 ${config.main} z-10`}
        style={[
          state === 'speaking_self' ? styles.activeScale : styles.idleScale,
          config.shadow,
        ]}
      >
        <Icon name={iconMap[state]} size={42} color={config.icon} />
      </TouchableOpacity>
    </View>
  )
}

export default PushToTalkButton
