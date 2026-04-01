import { getRoom } from "../repositories/roomRepository.js";

export default function registerChannelEventHandlers (socket, io) {
    socket.on("joinChannel", ({deviceId, roomId, channelId}) => {
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

        channel.addMember(deviceId);
        socket.join(roomId + ":" + channelId);
        socket.emit("channelJoined", { room, channel });

        console.log(deviceId, "joined channel", channelId, "in room", roomId);
    });

    socket.on("leaveChannel", ({deviceId, roomId, channelId}) => {
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
        socket.leave(roomId + ":" + channelId);
        socket.emit("channelLeft", { room, channel });

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