import { getRoom, createRoom, removeRoom } from "../repositories/roomRepository.js";
import { removeUser, getUsersInRoom } from "../repositories/userRepository.js";

export default function registerRoomEventHandlers (socket, io) {
    socket.on("createRoom", ({deviceId, displayName}) => {
        const room = createRoom(deviceId);
        room.addMember(deviceId);
        createUser(deviceId, displayName, room.id);

        socket.join(room.id);
        socket.join(room.id + ":" + room.channels["channel-1"].id);
        socket.emit("roomJoined", { room, users: getUsersInRoom(room.id) });

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
        createUser(deviceId, displayName, roomId);

        socket.join(roomId);
        socket.join(roomId + ":" + room.channels["channel-1"].id);
        socket.emit("roomJoined", { room, users: getUsersInRoom(room.id) });

        console.log(displayName, deviceId, "joined room", roomId);
    });

    socket.on("leaveRoom", ({deviceId, roomId}) => {
        const room = getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            console.log(displayName, deviceId, "failed to leave room", roomId, "(not found)");
            return;
        }

        room.removeMember(deviceId);
        removeUser(deviceId);
        if(room.members.length === 0) {
            removeRoom(roomId);
        }

        socket.leave(roomId);
        socket.emit("roomLeft", { room, users: getUsersInRoom(room.id) });

        console.log(displayName, deviceId, "left room", roomId);
    });
}
    