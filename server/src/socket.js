import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Room from "./models/Room.js";
import { getRoom, createRoom, removeRoom } from "./repositories/roomRepository.js";
import { getUser, getOrCreateUser, removeUser, getUsersInRoom } from "./repositories/userRepository.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export default function registerSocketEventHandlers (socket, io) {
    socket.on("createRoom", ({deviceId, displayName}) => {
        const room = createRoom(deviceId);
        createUser(deviceId, displayName, room.id);

        socket.join(room.id);
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

    socket.on("disconnect", () => {
        const user = getUser(socket.id);
        if (user) {
            const room = getRoom(user.roomId);
            if (room) {
                room.removeMember(user.id);
                removeUser(user.id);
                if(room.members.length === 0) {
                    removeRoom(user.roomId);
                }
            }
        }
    });

    
}