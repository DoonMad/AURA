import { getRoom } from "../repositories/roomRepository.js";
import { getUser, getUsersInRoom } from "../repositories/userRepository.js";

export default function registerAudioEventHandlers (socket, io) {
    socket.on("requestMic", ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) return;
        const channel = room.getChannel(channelId);
        if (!channel) return;

        // Only assign mic if it's free
        if (channel.activeSpeaker === null) {
            channel.activeSpeaker = deviceId;
            const user = getUser(deviceId);
            if (user) user.isSpeaking = true;

            io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });
            console.log(deviceId, "took mic in room", roomId, "channel", channelId);
        }
    });

    socket.on("releaseMic", ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) return;
        const channel = room.getChannel(channelId);
        if (!channel) return;

        // Only release if this user actually holds the mic
        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
            const user = getUser(deviceId);
            if (user) user.isSpeaking = false;

            io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });
            console.log(deviceId, "released mic in room", roomId, "channel", channelId);
        }
    });
}