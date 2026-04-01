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
    <View className="absolute bottom-10 w-full flex-row justify-between px-aura-xl items-end z-10 pointer-events-box-none">
      {/* Left Dock: Members & Info */}
      <View className="items-center pointer-events-auto">
        <TouchableOpacity
          onPress={onMembersPress}
          activeOpacity={0.7}
          className="w-14 h-14 bg-surface rounded-full items-center justify-center border border-aura-border shadow-lg"
        >
          <Icon name="users" size={24} color="#EEEDF2" />
        </TouchableOpacity>
        <Text className="text-[10px] font-bold mt-2 text-aura-muted uppercase tracking-widest">{memberChannelCount}/{totalMemberCount}</Text>
      </View>

      {/* Right Dock: Leave */}
      <View className="items-center pointer-events-auto">
        <TouchableOpacity
          onPress={onLeavePress}
          activeOpacity={0.7}
          className="w-14 h-14 bg-surface/50 rounded-full items-center justify-center border border-red-500/50 shadow-lg relative overflow-hidden"
        >
          <View className="absolute inset-0 bg-red-500/10" />
          <Icon name="power" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Text className="text-[10px] font-bold mt-2 text-red-500/80 uppercase tracking-widest">Exit</Text>
      </View>
    </View>
  )
}

export default BottomControls
