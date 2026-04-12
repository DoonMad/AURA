import { getRoom, createRoom, removeRoom } from "../repositories/roomRepository.js";
import { removeUser, getUsersInRoom, createUser } from "../repositories/userRepository.js";

export default function registerRoomEventHandlers (socket, io) {
    socket.on("createRoom", ({deviceId, displayName}) => {
        const room = createRoom(deviceId);
        room.addMember(deviceId);
        room.channels["channel-1"].addMember(deviceId);
        createUser(deviceId, displayName, room.id);

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
        room.channels["channel-1"].addMember(deviceId);
        createUser(deviceId, displayName, roomId);

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
            console.log(displayName, deviceId, "failed to leave room", roomId, "(not found)");
            return;
        }

        room.removeMember(deviceId);
        room.channels[channelId].removeMember(deviceId);
        removeUser(deviceId);
        if(room.members.length === 0) {
            removeRoom(roomId);
        }

        socket.leave(roomId);
        socket.emit("roomLeft", { roomId });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });

        console.log(displayName, deviceId, "left room", roomId);
    });
}
    