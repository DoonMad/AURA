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
      <Text className="text-aura-sm font-bold tracking-widest text-aura-muted uppercase mb-4">
        Active Channel
      </Text>

      <View className="flex-row items-center justify-between w-full max-w-sm bg-surface-light border border-aura-border/50 rounded-full px-2 py-2 shadow-lg">
        <TouchableOpacity 
          onPress={onPrev}
          activeOpacity={0.6}
          className="w-12 h-12 rounded-full items-center justify-center bg-surface border border-aura-border"
        >
          <Icon name="chevron-left" size={24} color="#EEEDF2" />
        </TouchableOpacity>

        <View className="items-center justify-center flex-1 px-4">
          <Text 
            className={`text-2xl font-black text-center tracking-wider ${isActive ? 'text-primary' : 'text-white'}`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {channelName}
          </Text>
          <Text className="text-xs text-aura-muted font-black tracking-widest mt-1">
            {currentIndex + 1} / {totalChannels}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={onNext}
          activeOpacity={0.6}
          className="w-12 h-12 rounded-full items-center justify-center bg-surface border border-aura-border"
        >
          <Icon name="chevron-right" size={24} color="#EEEDF2" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ChannelSelector
