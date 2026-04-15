import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { SpeakerAreaProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const SpeakerArea: React.FC<SpeakerAreaProps> = ({ speakerName, isActive = false }) => {
  
  // Determine if someone is actively speaking
  const isSpeaking = isActive && speakerName !== undefined;
  
  // Text display logic
  const displayName = speakerName || 'Standing by...';
  const displayLabel = isSpeaking ? 'Transmitting' : 'Idle';

  // Dynamic styling based on activity
  const iconColor = isSpeaking ? '#FCC1C1' : '#8B8A93';

  return (
    <View className="bg-surface-light border border-aura-border px-aura-md py-aura-sm rounded-full flex-row items-center shadow-lg">
      
      {/* Activity Indicator / Icon */}
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-aura-md border ${
          isSpeaking ? 'bg-red-500/20 border-red-500/50' : 'bg-surface border-aura-border'
        }`}
        style={isSpeaking ? styles.speakingGlow : undefined}
      >
        <Icon name={isSpeaking ? "volume-2" : "minus"} size={16} color={iconColor} />
      </View>
      
      {/* Speaker Identity */}
      <View className="mr-aura-lg">
        <Text className={`text-[10px] uppercase tracking-[3px] font-bold ${isSpeaking ? 'text-red-400' : 'text-aura-muted'}`}>
          {displayLabel}
        </Text>
        <Text className={`text-base font-black tracking-wide mt-0.5 ${isSpeaking ? 'text-white' : 'text-aura-text'}`}>
          {displayName}
        </Text>
      </View>

      {/* Dynamic/Static Sound Waves */}
      <View className="flex-row items-end space-x-1 h-6">
        <View className={`w-1.5 rounded-full ${isSpeaking ? 'bg-red-500' : 'bg-aura-border'} ${isSpeaking ? 'h-full' : 'h-1.5 mb-1'}`} />
        <View className={`w-1.5 rounded-full ${isSpeaking ? 'bg-red-500' : 'bg-aura-border'} ${isSpeaking ? 'h-3/5' : 'h-1.5 mb-1'}`} />
        <View className={`w-1.5 rounded-full ${isSpeaking ? 'bg-red-500' : 'bg-aura-border'} ${isSpeaking ? 'h-4/5' : 'h-1.5 mb-1'}`} />
        <View className={`w-1.5 rounded-full ${isSpeaking ? 'bg-red-500' : 'bg-aura-border'} ${isSpeaking ? 'h-2/5' : 'h-1.5 mb-1'}`} />
      </View>
      
    </View>
  )
}

const styles = StyleSheet.create({
  speakingGlow: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
})

export default SpeakerArea
