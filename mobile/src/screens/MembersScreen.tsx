import React from 'react'
import { ScrollView, Text, View, TouchableOpacity } from 'react-native'
import MemberListItem from '../components/MemberListItem'
import type { MembersScreenProps, User } from '../types'
import Icon from 'react-native-vector-icons/Feather'
import { SafeAreaView } from 'react-native-safe-area-context'
import useAppStore, { useMembersArray } from '../store/useAppStore'

const MembersScreen: React.FC<MembersScreenProps> = ({ navigation }) => {
  const room = useAppStore((s) => s.room)
  const deviceId = useAppStore((s) => s.deviceId)
  const members = useMembersArray()

  const activeChannel = room 
    ? Object.values(room.channels).find(ch => ch.members.includes(deviceId ?? '')) 
    : undefined;
  
  const currentChannelMembers = activeChannel?.members
    .map(id => members.find(m => m.id === id))
    .filter((m): m is User => m !== undefined) || [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-8 py-6 flex-row justify-between items-center border-b border-aura-border bg-surface/95 mb-6 shadow-lg z-20">
        <View>
          <Text className="text-2xl font-black text-primary tracking-[4px] uppercase">Members</Text>
          <Text className="text-[10px] text-aura-muted uppercase tracking-[3px] font-bold mt-1">
            Room ID: {room?.id || 'UNKNOWN'}
          </Text>
        </View>
        <TouchableOpacity 
          className="w-10 h-10 bg-surface-lighter rounded-full items-center justify-center border border-aura-border"
          onPress={() => navigation.goBack()}
        >
          <Icon name="x" size={16} color="#FAFAFA" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Active Channel Members */}
        <View className="mb-10">
          <View className="flex-row items-center mb-4">
            <Icon name="radio" size={14} color="#22C55E" />
            <Text className="text-xs font-black text-aura-active uppercase tracking-[3px] ml-2">
              Frequency: {activeChannel ? activeChannel.name : 'Unknown'}
            </Text>
          </View>
          {currentChannelMembers.map((member) => (
            <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
          ))}
          {currentChannelMembers.length === 0 && (
            <Text className="text-aura-muted/50 font-bold uppercase tracking-widest text-xs ml-6">No operatives on this frequency.</Text>
          )}
        </View>

        {/* All Room Members */}
        <View className="mb-12">
          <View className="flex-row items-center mb-4">
            <Icon name="users" size={14} color="#71717A" />
            <Text className="text-xs font-black text-aura-muted uppercase tracking-[3px] ml-2">All Personnel</Text>
          </View>
          {members.map((member) => (
            <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default MembersScreen
