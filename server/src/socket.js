import { getRoom, createRoom, removeRoom } from "./repositories/roomRepository.js";
import { getUser, getOrCreateUser, removeUser, getUsersInRoom } from "./repositories/userRepository.js";
import registerRoomEventHandlers from "./handlers/roomHandler.js";
import registerChannelEventHandlers from "./handlers/channelHandler.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export default function registerSocketEventHandlers (socket, io) {
    registerRoomEventHandlers(socket, io);
    registerChannelEventHandlers(socket, io);
    

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