import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

export interface ChannelSelectorProps {
  channelName: string;
  currentIndex: number;
  totalChannels: number;
  onPrev: () => void;
  onNext: () => void;
  isActive: boolean;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({ 
  channelName, 
  currentIndex, 
  totalChannels, 
  onPrev, 
  onNext,
  isActive 
}) => {
  return (
    <View className="items-center px-aura-md py-aura-xl mt-aura-lg z-20">
      <Text className="text-[10px] font-black tracking-[4px] text-aura-muted uppercase mb-4">
        Channel
      </Text>

      <View className="flex-row items-center justify-between w-full max-w-[280px] bg-surface-lighter border border-aura-border rounded-2xl px-2 py-3 shadow-lg">
        <TouchableOpacity 
          onPress={onPrev}
          activeOpacity={0.6}
          className="w-12 h-12 rounded-xl items-center justify-center bg-surface border border-aura-border/50"
        >
          <Icon name="chevron-left" size={20} color="#71717A" />
        </TouchableOpacity>

        <View className="items-center justify-center flex-1 px-4">
          <Text 
            className={`text-2xl font-black text-center tracking-wider ${isActive ? 'text-aura-active' : 'text-aura-text'}`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {channelName}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-aura-active shadow-glow-active' : 'bg-aura-muted'}`} />
            <Text className="text-[10px] text-aura-muted font-bold tracking-widest">
              CH 0{currentIndex + 1}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={onNext}
          activeOpacity={0.6}
          className="w-12 h-12 rounded-xl items-center justify-center bg-surface border border-aura-border/50"
        >
          <Icon name="chevron-right" size={20} color="#71717A" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ChannelSelector
