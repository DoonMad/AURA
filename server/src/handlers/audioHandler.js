import { getRoom } from "../repositories/roomRepository.js";
import { getUser, getUsersInRoom } from "../repositories/userRepository.js";

export default function registerAudioEventHandlers (socket, io) {
    socket.on("requestMic", ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) return;
        const channel = room.getChannel(channelId);
        if (!channel) return;
        const user = getUser(deviceId);
        if (!user || user.roomId !== roomId || user.currentChannelId !== channelId) {
            socket.emit("micDenied", { roomId, channelId, reason: "not-in-channel" });
            return;
        }

        // Only assign mic if it's free
        if (channel.activeSpeaker === null) {
            channel.activeSpeaker = deviceId;
            if (user) user.isSpeaking = true;

            io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });
            console.log(deviceId, "took mic in room", roomId, "channel", channelId);
        } else if (channel.activeSpeaker !== deviceId) {
            socket.emit("micDenied", { roomId, channelId, reason: "busy" });
        }
    });

    socket.on("releaseMic", ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) return;
        const channel = room.getChannel(channelId);
        if (!channel) return;
        const user = getUser(deviceId);
        if (!user || user.roomId !== roomId || user.currentChannelId !== channelId) {
            return;
        }

        // Only release if this user actually holds the mic
        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
            if (user) user.isSpeaking = false;

            io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });
            console.log(deviceId, "released mic in room", roomId, "channel", channelId);
        }
    });
}
