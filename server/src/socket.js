import { getRoom, removeRoom } from "./repositories/roomRepository.js";
import { getUserBySocketId, removeUser, getUsersInRoom } from "./repositories/userRepository.js";
import registerRoomEventHandlers from "./handlers/roomHandler.js";
import registerChannelEventHandlers from "./handlers/channelHandler.js";
import registerAudioEventHandlers from "./handlers/audioHandler.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export default function registerSocketEventHandlers (socket, io) {
    registerRoomEventHandlers(socket, io);
    registerChannelEventHandlers(socket, io);
    registerAudioEventHandlers(socket, io);

    socket.on("disconnect", () => {
        const user = getUserBySocketId(socket.id);
        if (user) {
            const room = getRoom(user.roomId);
            if (room) {
                room.removeMember(user.id);
                for (const channel of Object.values(room.channels)) {
                    channel.removeMember(user.id);
                    if (channel.activeSpeaker === user.id) {
                        channel.activeSpeaker = null;
                    }
                }

                removeUser(user.id);
                if(room.members.length === 0) {
                    removeRoom(user.roomId);
                } else {
                    io.to(room.id).emit("roomUpdated", { room, users: getUsersInRoom(room.id) });
                }
            }
        }
    });

}
