import { getRoom, createRoom, removeRoom } from "../repositories/roomRepository.js";
import { removeUser, getUsersInRoom, createUser, getUser } from "../repositories/userRepository.js";

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

function removeUserFromRoom(room, deviceId) {
    room.removeMember(deviceId);
    for (const channel of Object.values(room.channels)) {
        channel.removeMember(deviceId);
        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
        }
    }
}

export default function registerRoomEventHandlers (socket, io) {
    socket.on("createRoom", ({deviceId, displayName}) => {
        const room = createRoom(deviceId);
        room.addMember(deviceId);
        createUser(deviceId, displayName, room.id, socket.id);
        addUserToChannel(room, "channel-1", deviceId);

        socket.join(room.id);
        socket.join(room.id + ":" + room.channels["channel-1"].id);
        
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

        socket.join(roomId);
        socket.join(roomId + ":" + room.channels["channel-1"].id);
        
        socket.emit("roomJoined", { room, users: getUsersInRoom(room.id) });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });

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
        const currentChannelId = channelId || user?.currentChannelId;

        removeUserFromRoom(room, deviceId);
        removeUser(deviceId);
        if(room.members.length === 0) {
            removeRoom(roomId);
        }

        socket.leave(roomId);
        if (currentChannelId) {
            socket.leave(roomId + ":" + currentChannelId);
        }
        socket.emit("roomLeft", { roomId });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });

        console.log(deviceId, "left room", roomId);
    });
}
    
