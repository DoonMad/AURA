import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { BottomControlsProps } from '../types'

const BottomControls: React.FC<BottomControlsProps> = ({
  memberChannelCount,
  totalMemberCount,
  onMembersPress,
  onLeavePress,
  onSharePress,
  volume,
  onVolumeChange,
}) => {
  return (
    <View className="bg-surface p-aura-md rounded-aura-xl space-y-aura-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-aura-sm text-aura-text">{memberChannelCount} in channel • {totalMemberCount} total</Text>
        <TouchableOpacity onPress={onMembersPress} className="bg-primary rounded-aura-md px-aura-3 py-aura-2">
          <Text className="text-white font-semibold">Members</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-aura-2">
        <Text className="text-aura-sm text-aura-muted">Volume</Text>
        <View className="h-aura-2 w-full bg-aura-muted/30 rounded-full overflow-hidden">
          <View className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, volume * 100))}%` }} />
        </View>
      </View>

      <View className="flex-row justify-between">
        <TouchableOpacity onPress={onLeavePress} className="bg-red-500 rounded-aura-md px-aura-4 py-aura-2">
          <Text className="text-white font-semibold">Leave</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSharePress} className="bg-blue-500 rounded-aura-md px-aura-4 py-aura-2">
          <Text className="text-white font-semibold">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default BottomControls
