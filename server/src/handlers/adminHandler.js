import { getRoom, removeRoom } from "../repositories/roomRepository.js";
import { getUser, removeUser, getUsersInRoom } from "../repositories/userRepository.js";
import mediasoupManager from "../mediasoup/mediasoupManager.js";
import { createChannelRoomKey } from "./mediasoupHandler.js";
import { isRoomAdmin, removeMemberFromRoomState } from "../utils/roomHelpers.js";

function reply(callback, payload) {
    if (typeof callback === "function") {
        callback(payload);
    }
}

function fail(callback, message) {
    reply(callback, { ok: false, error: message });
}

function resolveAdminContext(socket, roomId) {
    const deviceId = socket.data.deviceId;
    if (!deviceId) {
        return { error: "socket-not-associated-with-device" };
    }

    const room = getRoom(roomId);
    if (!room) {
        return { error: "room-not-found" };
    }

    if (socket.data.roomId !== roomId) {
        return { error: "not-in-room" };
    }

    if (!isRoomAdmin(room, deviceId)) {
        return { error: "not-an-admin" };
    }

    return { deviceId, room };
}

function emitRoomUpdate(io, roomId) {
    const room = getRoom(roomId);
    if (!room) {
        return;
    }

    io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });
}

function closeRoomIfEmpty(roomId) {
    const room = getRoom(roomId);
    if (!room || room.members.length > 0) {
        return;
    }

    for (const channelId of Object.keys(room.channels)) {
        mediasoupManager.closeChannel(roomId, channelId).catch((error) => {
            console.warn("Failed to close mediasoup channel on room removal", error);
        });
    }
    removeRoom(roomId);
}

export default function registerAdminEventHandlers(socket, io) {
    socket.on("adminPromoteUser", ({ roomId, targetDeviceId }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const room = context.room;
            if (targetDeviceId === context.deviceId) {
                return fail(callback, "cannot-promote-self");
            }
            const targetUser = getUser(targetDeviceId);
            if (!targetUser || targetUser.roomId !== roomId) {
                return fail(callback, "user-not-found");
            }

            room.addAdmin(targetDeviceId);
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true, room });
        } catch (error) {
            console.error("adminPromoteUser failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("adminDemoteUser", ({ roomId, targetDeviceId }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const room = context.room;
            if (targetDeviceId === context.deviceId) {
                return fail(callback, "cannot-demote-self");
            }
            if (room.isOwner(targetDeviceId)) {
                return fail(callback, "cannot-demote-owner");
            }
            const targetUser = getUser(targetDeviceId);
            if (!targetUser || targetUser.roomId !== roomId) {
                return fail(callback, "user-not-found");
            }

            room.removeAdmin(targetDeviceId);
            room.ensureAdminPresence();
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true, room });
        } catch (error) {
            console.error("adminDemoteUser failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("adminCreateChannel", ({ roomId, channelName }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const channel = context.room.createChannel(channelName);
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true, channel });
        } catch (error) {
            console.error("adminCreateChannel failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("adminRenameChannel", ({ roomId, channelId, channelName }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const channel = context.room.getChannel(channelId);
            if (!channel) {
                return fail(callback, "channel-not-found");
            }

            channel.rename(channelName);
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true, channel });
        } catch (error) {
            console.error("adminRenameChannel failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("adminDeleteChannel", async ({ roomId, channelId }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const room = context.room;
            const channel = room.getChannel(channelId);
            if (!channel) {
                return fail(callback, "channel-not-found");
            }

            if (!channel.isEmpty()) {
                return fail(callback, "channel-not-empty");
            }

            room.removeChannel(channelId);
            await mediasoupManager.closeChannel(roomId, channelId).catch((error) => {
                console.warn("Failed to close mediasoup channel on delete", error);
            });
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true });
        } catch (error) {
            console.error("adminDeleteChannel failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("adminKickUser", async ({ roomId, targetDeviceId }, callback) => {
        try {
            const context = resolveAdminContext(socket, roomId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const room = context.room;
            if (targetDeviceId === context.deviceId) {
                return fail(callback, "cannot-kick-self");
            }
            if (room.isOwner(targetDeviceId)) {
                return fail(callback, "cannot-kick-owner");
            }
            const targetUser = getUser(targetDeviceId);
            if (!targetUser || targetUser.roomId !== roomId) {
                return fail(callback, "user-not-found");
            }

            const targetSocket = targetUser.socketId ? io.sockets.sockets.get(targetUser.socketId) : null;
            const currentChannelId = targetUser.currentChannelId;

            removeMemberFromRoomState(room, targetDeviceId);

            if (targetSocket) {
                targetSocket.leave(roomId);
                if (currentChannelId) {
                    targetSocket.leave(`${roomId}:${currentChannelId}`);
                    targetSocket.leave(createChannelRoomKey(roomId, currentChannelId));
                }
                targetSocket.data.roomId = null;
                targetSocket.data.currentChannelId = null;
            }

            if (currentChannelId) {
                await mediasoupManager.closePeerMedia(roomId, currentChannelId, targetDeviceId).catch((error) => {
                    console.warn("Failed to close mediasoup peer media on kick", error);
                });
            }

            removeUser(targetDeviceId);

            if (targetSocket) {
                targetSocket.emit("roomLeft", { roomId, reason: "kicked" });
            }

            closeRoomIfEmpty(roomId);
            emitRoomUpdate(io, roomId);
            reply(callback, { ok: true });
        } catch (error) {
            console.error("adminKickUser failed", error);
            fail(callback, error.message);
        }
    });
}
