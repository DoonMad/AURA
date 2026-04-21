import { getRoom, createRoom, removeRoom } from "../repositories/roomRepository.js";
import { removeUser, getUsersInRoom, createUser, getUser } from "../repositories/userRepository.js";
import { createChannelRoomKey } from "./mediasoupHandler.js";
import mediasoupManager from "../mediasoup/mediasoupManager.js";
import { removeMemberFromRoomState } from "../utils/roomHelpers.js";

function addUserToChannel(room, channelId, deviceId) {
    const channel = room.getChannel(channelId);
    if (!channel) {
        return null;
    }

    channel.addMember(deviceId);
    const user = getUser(deviceId);
    if (user) {
        user.currentChannelId = channelId;
    }
    return channel;
}

export default function registerRoomEventHandlers (socket, io) {
    socket.on("createRoom", ({deviceId, displayName}) => {
        const room = createRoom(deviceId);
        room.addMember(deviceId);
        createUser(deviceId, displayName, room.id, socket.id);
        addUserToChannel(room, "channel-1", deviceId);
        socket.data.deviceId = deviceId;
        socket.data.roomId = room.id;
        socket.data.currentChannelId = "channel-1";

        socket.join(room.id);
        socket.join(room.id + ":" + room.channels["channel-1"].id);
        socket.join(createChannelRoomKey(room.id, "channel-1"));
        
        socket.emit("roomJoined", { room, users: getUsersInRoom(room.id) });
        io.to(room.id).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });

        console.log(displayName, deviceId, "created a room ", room);
    });

    socket.on("joinRoom", ({deviceId, displayName, roomId}) => {
        const room = getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            console.log(displayName, deviceId, "failed to join room", roomId, "(not found)");
            return;
        }

        room.addMember(deviceId);
        createUser(deviceId, displayName, roomId, socket.id);
        addUserToChannel(room, "channel-1", deviceId);
        socket.data.deviceId = deviceId;
        socket.data.roomId = room.id;
        socket.data.currentChannelId = "channel-1";

        socket.join(roomId);
        socket.join(roomId + ":" + room.channels["channel-1"].id);
        socket.join(createChannelRoomKey(roomId, "channel-1"));
        
        socket.emit("roomJoined", { room, users: getUsersInRoom(room.id) });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });
        socket.to(roomId).emit("userJoined", { name: displayName, deviceId });

        console.log(displayName, deviceId, "joined room", roomId);
    });

    socket.on("leaveRoom", ({deviceId, channelId, roomId}) => {
        const room = getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            console.log(deviceId, "failed to leave room", roomId, "(not found)");
            return;
        }

        const user = getUser(deviceId);
        const userName = user?.name || 'Unknown';
        const currentChannelId = channelId || user?.currentChannelId;

        socket.to(roomId).emit("userLeft", { name: userName, deviceId });
        removeMemberFromRoomState(room, deviceId);
        if (currentChannelId) {
            mediasoupManager.closePeerMedia(roomId, currentChannelId, deviceId).catch((error) => {
                console.warn("Failed to close mediasoup media on leaveRoom", error);
            });
        }
        removeUser(deviceId);
        if(room.members.length === 0) {
            for (const channel of Object.keys(room.channels)) {
                mediasoupManager.closeChannel(roomId, channel).catch((error) => {
                    console.warn("Failed to close mediasoup channel on room removal", error);
                });
            }
            removeRoom(roomId);
        }

        socket.leave(roomId);
        if (currentChannelId) {
            socket.leave(roomId + ":" + currentChannelId);
            socket.leave(createChannelRoomKey(roomId, currentChannelId));
        }
        socket.data.roomId = null;
        socket.data.currentChannelId = null;
        socket.emit("roomLeft", { roomId });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });

        console.log(deviceId, "left room", roomId);
    });
}

export { addUserToChannel };
