import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import type { AdminScreenProps } from '../types';
import useAppStore, { useMembersArray } from '../store/useAppStore';
import TextInputField from '../components/TextInputField';
import PrimaryButton from '../components/PrimaryButton';
import { triggerHaptic } from '../services/haptics';

type AdminActionState = {
  title: string;
  message: string;
};

const AdminScreen: React.FC<AdminScreenProps> = ({ navigation }) => {
  const room = useAppStore((s) => s.room);
  const socket = useAppStore((s) => s.socket);
  const deviceId = useAppStore((s) => s.deviceId);
  const setNotice = useAppStore((s) => s.setNotice);
  const members = useMembersArray();

  const channels = useMemo(() => (room ? Object.values(room.channels) : []), [room]);
  const isOwner = !!room && room.ownerId === deviceId;
  const isAdmin = !!room && !!deviceId && room.admins.includes(deviceId);

  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [renameChannelName, setRenameChannelName] = useState('');
  const [actionState, setActionState] = useState<AdminActionState | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? channels[0] ?? null,
    [channels, selectedChannelId],
  );

  useEffect(() => {
    if (selectedChannel) {
      setRenameChannelName(selectedChannel.name);
    }
  }, [selectedChannel?.id, selectedChannel?.name]);

  useEffect(() => {
    if (channels.length === 0) {
      setSelectedChannelId('');
      return;
    }

    const stillExists = channels.some((channel) => channel.id === selectedChannelId);
    if (!selectedChannelId || !stillExists) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (!room) {
      navigation.goBack();
    }
  }, [room, navigation]);

  const showActionResult = (title: string, message: string, tone: 'success' | 'warning' | 'error' = 'success') => {
    setActionState({ title, message });
    setNotice({ tone, title, message });
    triggerHaptic(tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'error');
  };

  const runAction = async (action: () => Promise<unknown>, successTitle: string, successMessage: string) => {
    if (!socket || !room || busy) return;
    setBusy(true);
    try {
      await action();
      showActionResult(successTitle, successMessage, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed.';
      showActionResult('Admin Action Failed', message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!socket || !room) return;
    const trimmed = newChannelName.trim();
    if (!trimmed) {
      showActionResult('Missing Channel Name', 'Enter a name for the new channel.', 'warning');
      return;
    }

    await runAction(async () => {
      const response = await new Promise<{ ok: true; channel: { id: string; name: string } }>((resolve, reject) => {
        socket.emit('adminCreateChannel', {
          roomId: room.id,
          channelName: trimmed,
        }, (payload: { ok?: boolean; error?: string; channel?: { id: string; name: string } }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to create channel.'));
            return;
          }

          resolve(payload as { ok: true; channel: { id: string; name: string } });
        });
      });

      setSelectedChannelId(response.channel.id);
      setNewChannelName('');
      return response;
    }, 'Channel Created', `Created "${trimmed}". Channel IDs stay stable for routing.`);
  };

  const handleRenameChannel = async () => {
    if (!socket || !room || !selectedChannel) return;
    const trimmed = renameChannelName.trim();
    if (!trimmed) {
      showActionResult('Missing Channel Name', 'Channel names cannot be empty.', 'warning');
      return;
    }

    const nextName = trimmed;
    const currentChannelId = selectedChannel.id;

    await runAction(async () => {
      await new Promise<void>((resolve, reject) => {
        socket.emit('adminRenameChannel', {
          roomId: room.id,
          channelId: currentChannelId,
          channelName: nextName,
        }, (payload: { ok?: boolean; error?: string }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to rename channel.'));
            return;
          }

          resolve();
        });
      });
    }, 'Channel Renamed', `Renamed to "${nextName}". The channel ID did not change.`);
  };

  const handleDeleteChannel = async () => {
    if (!socket || !room || !selectedChannel) return;
    const channel = selectedChannel;

    if (channel.members.length > 0) {
      showActionResult('Channel Busy', 'A channel can only be deleted when it has no members.', 'warning');
      return;
    }

    await runAction(async () => {
      await new Promise<void>((resolve, reject) => {
        socket.emit('adminDeleteChannel', {
          roomId: room.id,
          channelId: channel.id,
        }, (payload: { ok?: boolean; error?: string }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to delete channel.'));
            return;
          }

          resolve();
        });
      });
    }, 'Channel Deleted', `${channel.name} was removed from the room.`);
  };

  const handlePromoteUser = async (targetDeviceId: string) => {
    if (!socket || !room || !deviceId) return;
    await runAction(async () => {
      await new Promise<void>((resolve, reject) => {
        socket.emit('adminPromoteUser', {
          roomId: room.id,
          targetDeviceId,
        }, (payload: { ok?: boolean; error?: string }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to promote user.'));
            return;
          }

          resolve();
        });
      });
    }, 'Admin Granted', 'The selected member is now an admin.');
  };

  const handleDemoteUser = async (targetDeviceId: string) => {
    if (!socket || !room || !deviceId) return;
    await runAction(async () => {
      await new Promise<void>((resolve, reject) => {
        socket.emit('adminDemoteUser', {
          roomId: room.id,
          targetDeviceId,
        }, (payload: { ok?: boolean; error?: string }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to demote user.'));
            return;
          }

          resolve();
        });
      });
    }, 'Admin Removed', 'The selected admin was demoted.');
  };

  const handleKickUser = async (targetDeviceId: string, name: string) => {
    if (!socket || !room || !deviceId) return;
    await runAction(async () => {
      await new Promise<void>((resolve, reject) => {
        socket.emit('adminKickUser', {
          roomId: room.id,
          targetDeviceId,
        }, (payload: { ok?: boolean; error?: string }) => {
          if (!payload || payload.ok === false) {
            reject(new Error(payload?.error ?? 'Failed to remove member.'));
            return;
          }

          resolve();
        });
      });
    }, 'Member Removed', `${name} was removed from the room.`);
  };

  if (!room) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl font-black text-primary tracking-[4px] uppercase">No Room</Text>
          <Text className="mt-3 text-aura-muted text-center">
            You are not currently in a room.
          </Text>
          <View className="mt-6 w-full">
            <PrimaryButton title="Back" onPress={() => navigation.goBack()} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center border border-aura-border">
            <Icon name="shield" size={28} color="#FAFAFA" />
          </View>
          <Text className="mt-6 text-3xl font-black text-primary tracking-[4px] uppercase text-center">
            Admin Only
          </Text>
          <Text className="mt-3 text-aura-muted text-center leading-6">
            Only the room owner and granted admins can manage channels and members.
          </Text>
          <View className="mt-8 w-full">
            <PrimaryButton title="Back to Room" onPress={() => navigation.goBack()} variant="filled" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-8 py-6 flex-row justify-between items-center border-b border-aura-border bg-surface/95 mb-4 shadow-lg z-20">
          <View>
            <Text className="text-2xl font-black text-primary tracking-[4px] uppercase">Admin</Text>
            <Text className="text-[10px] text-aura-muted uppercase tracking-[3px] font-bold mt-1">
              Room {room.id} · Owner {room.ownerId === deviceId ? 'You' : 'Locked'}
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
          <View className="mb-5 rounded-3xl border border-aura-border bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-sm uppercase tracking-[3px] text-aura-muted font-black">Room Owner</Text>
                <Text className="text-2xl font-black text-primary mt-2">
                  {room.ownerId === deviceId ? 'You own this room' : 'Room Owner'}
                </Text>
                <Text className="text-aura-muted mt-2 leading-6">
                  The owner can grant admin access, create channels, and manage the room structure.
                </Text>
              </View>
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-aura-active/10 border border-aura-active/30">
                <Icon name="crown" size={22} color="#22C55E" />
              </View>
            </View>
          </View>

          {actionState && (
            <View className="mb-5 rounded-2xl border border-aura-active/25 bg-aura-active/10 px-4 py-4">
              <Text className="text-primary font-black uppercase tracking-[2px] text-xs">
                {actionState.title}
              </Text>
              <Text className="text-aura-muted mt-1 leading-5">{actionState.message}</Text>
            </View>
          )}

          <View className="mb-5 rounded-3xl border border-aura-border bg-surface p-5">
            <Text className="text-xs text-aura-muted uppercase tracking-[4px] font-black mb-3">Create Channel</Text>
            <TextInputField
              placeholder="Channel name"
              value={newChannelName}
              onChangeText={setNewChannelName}
              autoCapitalize="words"
            />
            <View className="h-3" />
            <PrimaryButton
              title="Create Channel"
              onPress={handleCreateChannel}
              variant="filled"
              disabled={busy}
            />
          </View>

          <View className="mb-5 rounded-3xl border border-aura-border bg-surface p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs text-aura-muted uppercase tracking-[4px] font-black">Channels</Text>
              <Text className="text-[10px] text-aura-muted uppercase tracking-[2px] font-bold">
                {channels.length} Active
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {channels.map((channel) => {
                const active = channel.id === selectedChannel?.id;
                return (
                  <TouchableOpacity
                    key={channel.id}
                    onPress={() => setSelectedChannelId(channel.id)}
                    activeOpacity={0.8}
                    style={{
                      minWidth: 124,
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: active ? '#FAFAFA' : '#27272A',
                      backgroundColor: active ? '#FAFAFA' : '#18181B',
                    }}
                  >
                    <Text style={{ color: active ? '#09090B' : '#FAFAFA', fontWeight: '900', fontSize: 14 }}>
                      {channel.name}
                    </Text>
                    <Text style={{ color: active ? '#27272A' : '#A1A1AA', fontSize: 11, marginTop: 4, fontWeight: '700' }}>
                      {channel.id}
                    </Text>
                    <Text style={{ color: active ? '#27272A' : '#A1A1AA', fontSize: 11, marginTop: 4 }}>
                      {channel.members.length} member{channel.members.length === 1 ? '' : 's'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="mb-5 rounded-3xl border border-aura-border bg-surface p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs text-aura-muted uppercase tracking-[4px] font-black">Selected Channel</Text>
              <Text className="text-[10px] text-aura-muted uppercase tracking-[2px] font-bold">
                {selectedChannel ? selectedChannel.id : 'None'}
              </Text>
            </View>

            {selectedChannel ? (
              <>
                <Text className="text-2xl font-black text-primary">{selectedChannel.name}</Text>
                <Text className="text-aura-muted mt-1">
                  Renaming only changes the display label. The channel ID stays stable for routing.
                </Text>

                <View className="mt-4">
                  <Text className="text-xs text-aura-muted uppercase tracking-[3px] font-black mb-2">Rename</Text>
                  <TextInputField
                    placeholder="New channel name"
                    value={renameChannelName}
                    onChangeText={setRenameChannelName}
                    autoCapitalize="words"
                  />
                  <View className="h-3" />
                  <PrimaryButton
                    title="Save Name"
                    onPress={handleRenameChannel}
                    variant="outline"
                    disabled={busy}
                  />
                </View>

                <View className="mt-4 rounded-2xl border border-dashed border-aura-border bg-background px-4 py-4">
                  <Text className="text-xs text-aura-muted uppercase tracking-[3px] font-black">Delete Rule</Text>
                  <Text className="text-aura-muted mt-2 leading-5">
                    {selectedChannel.members.length === 0
                      ? 'This channel is empty and can be deleted.'
                      : 'This channel cannot be deleted until it is empty.'}
                  </Text>
                  <View className="mt-3">
                    <PrimaryButton
                      title="Delete Channel"
                      onPress={handleDeleteChannel}
                      variant="filled"
                      disabled={busy || selectedChannel.members.length > 0}
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text className="text-aura-muted">No channel selected.</Text>
            )}
          </View>

          <View className="mb-10 rounded-3xl border border-aura-border bg-surface p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs text-aura-muted uppercase tracking-[4px] font-black">Members</Text>
              <Text className="text-[10px] text-aura-muted uppercase tracking-[2px] font-bold">
                {members.length} Online
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {members.map((member) => {
                const memberIsOwner = room.ownerId === member.id;
                const memberIsAdmin = room.admins.includes(member.id);
                const isSelf = member.id === deviceId;

                return (
                  <View key={member.id} className="rounded-2xl border border-aura-border bg-background px-4 py-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-black text-primary">{member.name}</Text>
                        <Text className="text-[11px] text-aura-muted mt-1">{member.id}</Text>
                      </View>

                      <View className="items-end">
                        {memberIsOwner ? (
                          <View className="px-3 py-1 rounded-full border border-aura-active/30 bg-aura-active/10">
                            <Text className="text-[10px] font-black text-aura-active uppercase tracking-[2px]">
                              Owner
                            </Text>
                          </View>
                        ) : memberIsAdmin ? (
                          <View className="px-3 py-1 rounded-full border border-aura-border bg-surface-lighter">
                            <Text className="text-[10px] font-black text-primary uppercase tracking-[2px]">
                              Admin
                            </Text>
                          </View>
                        ) : (
                          <View className="px-3 py-1 rounded-full border border-aura-border bg-surface-lighter">
                            <Text className="text-[10px] font-black text-aura-muted uppercase tracking-[2px]">
                              Member
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {!memberIsOwner && !isSelf && (
                        <TouchableOpacity
                          onPress={() => memberIsAdmin ? handleDemoteUser(member.id) : handlePromoteUser(member.id)}
                          activeOpacity={0.8}
                          className="px-4 py-2 rounded-full border border-aura-border bg-surface-lighter"
                        >
                          <Text className="text-[11px] font-black text-primary uppercase tracking-[2px]">
                            {memberIsAdmin ? 'Revoke Admin' : 'Grant Admin'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!memberIsOwner && !isSelf && (
                        <TouchableOpacity
                          onPress={() => handleKickUser(member.id, member.name)}
                          activeOpacity={0.8}
                          className="px-4 py-2 rounded-full border border-aura-danger/30 bg-aura-danger/10"
                        >
                          <Text className="text-[11px] font-black text-aura-danger uppercase tracking-[2px]">
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isSelf && (
                        <View className="px-4 py-2 rounded-full border border-aura-border bg-surface-lighter">
                          <Text className="text-[11px] font-black text-aura-muted uppercase tracking-[2px]">
                            You
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AdminScreen;
