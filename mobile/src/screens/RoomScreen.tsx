import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types/navigation'

type RoomScreenProps = NativeStackScreenProps<RootStackParamList, 'Room'>

const RoomScreen: React.FC<RoomScreenProps> = ({ route }) => {
  const { roomId } = route.params

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-aura-2xl font-extrabold text-primary mb-aura-lg">
          Room {roomId}
        </Text>
        <Text className="text-aura-sm text-aura-muted">
          Connected to room
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default RoomScreen