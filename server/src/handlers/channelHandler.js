import { getRoom } from "../repositories/roomRepository.js";
import { getUser, getUsersInRoom } from "../repositories/userRepository.js";
import mediasoupManager from "../mediasoup/mediasoupManager.js";
import { createChannelRoomKey } from "./mediasoupHandler.js";

export default function registerChannelEventHandlers (socket, io) {
    socket.on("joinChannel", async ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            console.log(deviceId, "failed to join channel", channelId, "in room", roomId, "(not found)");
            return;
        }

        const channel = room.getChannel(channelId);
        if (!channel) {
            socket.emit("error", { message: "Channel not found" });
            console.log(deviceId, "failed to join channel", channelId, "in room", roomId, "(not found)");
            return;
        }

        const user = getUser(deviceId);
        if (user?.currentChannelId) {
            const previousChannel = room.getChannel(user.currentChannelId);
            if (previousChannel) {
                previousChannel.removeMember(deviceId);
                if (previousChannel.activeSpeaker === deviceId) {
                    previousChannel.activeSpeaker = null;
                }
                await mediasoupManager.closePeerMedia(roomId, previousChannel.id, deviceId);
            }
            socket.leave(roomId + ":" + user.currentChannelId);
            socket.leave(createChannelRoomKey(roomId, user.currentChannelId));
        }

        channel.addMember(deviceId);
        if (user) {
            user.currentChannelId = channelId;
        }
        socket.data.currentChannelId = channelId;
        socket.join(roomId + ":" + channelId);
        socket.join(createChannelRoomKey(roomId, channelId));
        socket.emit("channelJoined", { room, channel });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });

        console.log(deviceId, "joined channel", channelId, "in room", roomId);
    });

    socket.on("leaveChannel", async ({deviceId, roomId, channelId}) => {
        const room = getRoom(roomId);
        if (!room) {
            socket.emit("error", { message: "Room not found" });
            console.log(deviceId, "failed to leave channel", channelId, "in room", roomId, "(not found)");
            return;
        }

        const channel = room.getChannel(channelId);
        if (!channel) {
            socket.emit("error", { message: "Channel not found" });
            console.log(deviceId, "failed to leave channel", channelId, "in room", roomId, "(not found)");
            return;
        }

        channel.removeMember(deviceId);
        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
        }
        const user = getUser(deviceId);
        if (user && user.currentChannelId === channelId) {
            user.currentChannelId = null;
        }
        socket.leave(roomId + ":" + channelId);
        socket.leave(createChannelRoomKey(roomId, channelId));
        await mediasoupManager.closePeerMedia(roomId, channelId, deviceId);
        socket.data.currentChannelId = null;
        socket.emit("channelLeft", { room, channel });
        io.to(roomId).emit("roomUpdated", { room, users: getUsersInRoom(roomId) });

        console.log(deviceId, "left channel", channelId, "in room", roomId);
    });

    socket.on("createChannel", ({deviceId, roomId, channelName}) => {
        // const room = getRoom(roomId);
        // if (!room) {
        //     socket.emit("error", { message: "Room not found" });
        //     console.log(deviceId, "failed to create channel", channelName, "in room", roomId, "(not found)");
        //     return;
        // }

        // const channel = room.addChannel(channelName);
        // socket.join(roomId + ":" + channel.id);
        // socket.emit("channelCreated", { room, channel });

        console.log(deviceId, "created channel", channelName, "in room", roomId);
    });

    socket.on("deleteChannel", ({deviceId, roomId, channelName}) => {
        // const room = getRoom(roomId);
        // if (!room) {
        //     socket.emit("error", { message: "Room not found" });
        //     console.log(deviceId, "failed to create channel", channelName, "in room", roomId, "(not found)");
        //     return;
        // }

        // const channel = room.addChannel(channelName);
        // socket.join(roomId + ":" + channel.id);
        // socket.emit("channelCreated", { room, channel });

        console.log(deviceId, "deleted channel", channelName, "in room", roomId);
    });

    socket.on("updateChannel", ({deviceId, roomId, channelName}) => {
        // const room = getRoom(roomId);
        // if (!room) {
        //     socket.emit("error", { message: "Room not found" });
        //     console.log(deviceId, "failed to create channel", channelName, "in room", roomId, "(not found)");
        //     return;
        // }

        // const channel = room.addChannel(channelName);
        // socket.join(roomId + ":" + channel.id);
        // socket.emit("channelCreated", { room, channel });

        console.log(deviceId, "updated channel", channelName, "in room", roomId);
    });
}
