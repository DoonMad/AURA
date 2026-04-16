import { getRoom, removeRoom } from "./repositories/roomRepository.js";
import { getUserBySocketId, removeUser, getUsersInRoom } from "./repositories/userRepository.js";
import registerRoomEventHandlers from "./handlers/roomHandler.js";
import registerChannelEventHandlers from "./handlers/channelHandler.js";
import registerAudioEventHandlers from "./handlers/audioHandler.js";
import registerMediasoupEventHandlers from "./handlers/mediasoupHandler.js";
import mediasoupManager from "./mediasoup/mediasoupManager.js";
import { createChannelRoomKey } from "./handlers/mediasoupHandler.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export default function registerSocketEventHandlers (socket, io) {
    registerRoomEventHandlers(socket, io);
    registerChannelEventHandlers(socket, io);
    registerAudioEventHandlers(socket, io);
    registerMediasoupEventHandlers(socket, io);

    socket.on("disconnect", () => {
        const user = getUserBySocketId(socket.id);
        if (user) {
            const room = getRoom(user.roomId);
            if (room) {
                room.removeMember(user.id);
                const channel = room.getChannel(user.currentChannelId);
                if (channel) {
                    channel.removeMember(user.id);
                    if (channel.activeSpeaker === user.id) {
                        channel.activeSpeaker = null;
                    }
                }

                if (user.currentChannelId) {
                    socket.leave(createChannelRoomKey(user.roomId, user.currentChannelId));
                }
                if (user.currentChannelId) {
                    mediasoupManager.closePeerMedia(user.roomId, user.currentChannelId, user.id).catch((error) => {
                        console.warn("Failed to close mediasoup peer media on disconnect", error);
                    });
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
