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
  glowActive: {
    shadowColor: '#22C55E', // aura-active
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  glowReceiving: {
    shadowColor: '#EAB308', // aura-standby
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});

const statusMap: Record<TalkState, { main: string; icon: string; text: string; label: string; shadow?: ViewStyle }> = {
  idle: {
    main: 'bg-surface-light border-aura-border',
    icon: '#71717A',
    text: 'text-aura-muted',
    label: 'STANDBY'
  },
  ready: {
    main: 'bg-surface-light border-aura-border',
    icon: '#71717A',
    text: 'text-aura-muted',
    label: 'STANDBY'
  },
  speaking_self: {
    main: 'bg-aura-active border-green-400',
    icon: '#09090B',
    text: 'text-aura-active',
    label: 'TRANSMITTING',
    shadow: styles.glowActive
  },
  speaking_other: {
    main: 'bg-aura-standby border-yellow-400',
    icon: '#09090B',
    text: 'text-aura-standby',
    label: 'RECEIVING',
    shadow: styles.glowReceiving
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
    <View className="absolute bottom-20 self-center items-center z-30">
      <Text className={`text-xs font-black uppercase tracking-[6px] mb-6 z-10 ${config.text}`}>
        {config.label}
      </Text>
      
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut} 
        disabled={isBusy}
        activeOpacity={0.8}
        className={`w-36 h-36 rounded-aura-full items-center justify-center border-4 ${config.main} z-10`}
        style={[
          state === 'speaking_self' ? styles.activeScale : styles.idleScale,
          config.shadow,
        ]}
      >
        <Icon name={iconMap[state]} size={48} color={config.icon} />
      </TouchableOpacity>
    </View>
  )
}

export default PushToTalkButton
