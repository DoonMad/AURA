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

  const showAdminControls = room?.admins.includes(deviceId ?? '') ?? false

  const onCreateChannel = () => {
    // TODO: Implement
  }

  const onRenameChannel = () => {
    // TODO: Implement
  }

  // For visual demo if empty
  const firstChannel = room ? Object.values(room.channels)[0] : undefined;
  const channelMemberIds = firstChannel ? firstChannel.members : [];
  const mappedChannelMembers = channelMemberIds
    .map(id => members.find(m => m.id === id))
    .filter((m): m is User => m !== undefined);

  const defaultChannelMembers: User[] = mappedChannelMembers.length ? mappedChannelMembers : [
    { id: '1', name: 'Alpha Leader', isSpeaking: true, roomId: room?.id ?? '' },
    { id: '2', name: 'Bravo Six', isSpeaking: false, roomId: room?.id ?? '' },
  ];

  const defaultAllMembers: User[] = members.length ? members : [
    { id: '3', name: 'Delta Actual', isSpeaking: false, roomId: room?.id ?? '' },
    { id: '4', name: 'Echo Base', isSpeaking: false, roomId: room?.id ?? '' },
    ...defaultChannelMembers
  ];

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
        
        {showAdminControls && (
          <View className="bg-surface border border-primary/30 rounded-2xl p-4 mb-6 relative overflow-hidden">
            <View className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
            <Text className="text-xs uppercase font-bold text-primary tracking-widest mb-4">Command Controls</Text>
            
            <View className="flex-row space-x-4">
              <TouchableOpacity onPress={onCreateChannel} className="flex-1 bg-primary/20 border border-primary/50 py-3 rounded-xl items-center flex-row justify-center">
                <Icon name="plus-circle" size={16} color="#A78BFA" />
                <Text className="text-primary font-bold ml-2">New Channel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onRenameChannel} className="flex-1 bg-surface-light border border-aura-muted/30 py-3 rounded-xl items-center flex-row justify-center">
                <Icon name="edit-2" size={16} color="#EEEDF2" />
                <Text className="text-white font-bold ml-2">Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Icon name="radio" size={18} color="#7C5CFC" />
            <Text className="text-sm font-bold text-primary uppercase tracking-widest ml-2">Active Channel</Text>
          </View>
          {defaultChannelMembers.map((member) => (
            <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
          ))}
        </View>

        <View className="mb-10">
          <View className="flex-row items-center mb-3">
            <Icon name="users" size={18} color="#8B8A93" />
            <Text className="text-sm font-bold text-aura-muted uppercase tracking-widest ml-2">All Personnel</Text>
          </View>
          {defaultAllMembers.map((member) => (
            <MemberListItem key={member.id} name={member.name} isSpeaking={member.isSpeaking} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default MembersScreen
