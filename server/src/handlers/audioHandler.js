import { getRoom } from "../repositories/roomRepository.js";
import { getUser, getUsersInRoom } from "../repositories/userRepository.js";
import mediasoupManager from "../mediasoup/mediasoupManager.js";

export default function registerAudioEventHandlers (socket, io) {
    socket.on("requestMic", async ({deviceId, roomId, channelId}) => {
        console.log("[audio] requestMic", { deviceId, roomId, channelId });
        const room = getRoom(roomId);
        if (!room) {
            console.warn("[audio] requestMic denied: room not found");
            socket.emit("micDenied", { roomId, channelId, reason: "room-not-found" });
            return;
        }
        const channel = room.getChannel(channelId);
        if (!channel) {
            console.warn("[audio] requestMic denied: channel not found");
            socket.emit("micDenied", { roomId, channelId, reason: "channel-not-found" });
            return;
        }
        const user = getUser(deviceId);
        if (!user || user.roomId !== roomId || user.currentChannelId !== channelId) {
            console.warn("[audio] requestMic denied: not in channel", { deviceId, roomId, channelId, userRoomId: user?.roomId, userChannelId: user?.currentChannelId });
            socket.emit("micDenied", { roomId, channelId, reason: "not-in-channel" });
            return;
        }

        if (channel.activeSpeaker === deviceId) {
            console.log("[audio] requestMic already granted", { deviceId, roomId, channelId });
            socket.emit("micGranted", { roomId, channelId });
            io.to(roomId).emit("micStateUpdated", {
                roomId,
                channelId,
                activeSpeaker: deviceId,
                users: getUsersInRoom(roomId)
            });
            return;
        }

        if (channel.activeSpeaker === null) {
            channel.activeSpeaker = deviceId;
            if (user) user.isSpeaking = true;

            const resumed = await mediasoupManager.resumePeerProducer(roomId, channelId, deviceId);
            console.log("[audio] mic granted", { deviceId, roomId, channelId, resumed });
            socket.emit("micGranted", { roomId, channelId });
            io.to(roomId).emit("micStateUpdated", {
                roomId,
                channelId,
                activeSpeaker: deviceId,
                users: getUsersInRoom(roomId)
            });
        } else if (channel.activeSpeaker !== deviceId) {
            console.warn("[audio] requestMic denied: busy", { deviceId, roomId, channelId, activeSpeaker: channel.activeSpeaker });
            socket.emit("micDenied", { roomId, channelId, reason: "busy" });
        }
    });

    socket.on("releaseMic", async ({deviceId, roomId, channelId}) => {
        console.log("[audio] releaseMic", { deviceId, roomId, channelId });
        const room = getRoom(roomId);
        if (!room) {
            console.warn("[audio] releaseMic ignored: room not found");
            return;
        }
        const channel = room.getChannel(channelId);
        if (!channel) {
            console.warn("[audio] releaseMic ignored: channel not found");
            return;
        }
        const user = getUser(deviceId);
        if (!user || user.roomId !== roomId || user.currentChannelId !== channelId) {
            console.warn("[audio] releaseMic ignored: not in channel", { deviceId, roomId, channelId });
            return;
        }

        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
            if (user) user.isSpeaking = false;

            const closed = await mediasoupManager.closePeerAudioProducer(roomId, channelId, deviceId);
            console.log("[audio] mic released", { deviceId, roomId, channelId, closed });
            socket.emit("micReleased", { roomId, channelId });
            io.to(roomId).emit("micStateUpdated", {
                roomId,
                channelId,
                activeSpeaker: null,
                users: getUsersInRoom(roomId)
            });
            return;
        }

        console.log("[audio] releaseMic ignored: speaker mismatch", {
            deviceId,
            roomId,
            channelId,
            activeSpeaker: channel.activeSpeaker
        });
    });
}
