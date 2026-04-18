import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { BottomControlsProps } from '../types'
import Icon from 'react-native-vector-icons/Feather'

const BottomControls: React.FC<Omit<BottomControlsProps, 'onSharePress'>> = ({
  memberChannelCount,
  totalMemberCount,
  onMembersPress,
  onLeavePress,
  volume,
  onVolumeChange,
}) => {
  return (
    <View className="absolute bottom-10 w-full flex-row justify-between px-8 items-end z-10 pointer-events-box-none">
      {/* Left Dock: Members & Info */}
      <View className="items-center pointer-events-auto">
        <TouchableOpacity
          onPress={onMembersPress}
          activeOpacity={0.7}
          className="w-12 h-12 bg-surface-lighter rounded-2xl items-center justify-center border border-aura-border shadow-lg"
        >
          <Icon name="users" size={20} color="#FAFAFA" />
        </TouchableOpacity>
        <Text className="text-[10px] font-black mt-2 text-aura-muted uppercase tracking-[2px]">
          {memberChannelCount}/{totalMemberCount}
        </Text>
      </View>

      {/* Right Dock: Leave */}
      <View className="items-center pointer-events-auto">
        <TouchableOpacity
          onPress={onLeavePress}
          activeOpacity={0.7}
          className="w-12 h-12 bg-surface/50 rounded-2xl items-center justify-center border border-aura-danger/50 shadow-lg relative overflow-hidden"
        >
          <View className="absolute inset-0 bg-aura-danger/10" />
          <Icon name="power" size={20} color="#EF4444" />
        </TouchableOpacity>
        <Text className="text-[10px] font-black mt-2 text-aura-danger/80 uppercase tracking-[2px]">
          Leave Room
        </Text>
      </View>
    </View>
  )
}

export default BottomControls
