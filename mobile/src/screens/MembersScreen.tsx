import React from 'react'
import { ScrollView, Text, View, TouchableOpacity } from 'react-native'
import MemberListItem from '../components/MemberListItem'
import type { MembersScreenProps, User } from '../types'
import Icon from 'react-native-vector-icons/Feather'
import { SafeAreaView } from 'react-native-safe-area-context'
import useAppStore, { useMembersArray } from '../store/useAppStore'

const MembersScreen: React.FC<MembersScreenProps> = ({ navigation }) => {
  // ── Read from the global store ──
  const room = useAppStore((s) => s.room)
  const deviceId = useAppStore((s) => s.deviceId)
  const members = useMembersArray()

  // Find the channel the user is currently in
  const activeChannel = room 
    ? Object.values(room.channels).find(ch => ch.members.includes(deviceId ?? '')) 
    : undefined;
  
  // Resolve member IDs to User objects for the active channel
  const currentChannelMembers = activeChannel?.members
    .map(id => members.find(m => m.id === id))
    .filter((m): m is User => m !== undefined) || [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-aura-border bg-surface/50 mb-4 shadow-lg rounded-b-xl z-20">
        <Text className="text-3xl font-black text-white tracking-wider">Directory</Text>
        <TouchableOpacity className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-aura-border">
          <Icon name="search" size={20} color="#EEEDF2" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        
        {/* Active Channel Members */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Icon name="radio" size={18} color="#7C5CFC" />
            <Text className="text-sm font-bold text-primary uppercase tracking-widest ml-2">
              Active Channel {activeChannel ? `- ${activeChannel.name}` : ''}
            </Text>
          </View>
          {currentChannelMembers.map((member) => (
            <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
          ))}
          {currentChannelMembers.length === 0 && (
            <Text className="text-aura-muted/50 italic ml-7 text-sm">No members in channel.</Text>
          )}
        </View>

        {/* All Room Members */}
        <View className="mb-10">
          <View className="flex-row items-center mb-3">
            <Icon name="users" size={18} color="#8B8A93" />
            <Text className="text-sm font-bold text-aura-muted uppercase tracking-widest ml-2">All Personnel</Text>
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
