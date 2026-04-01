

export function registerAudioEventHandlers (socket, io) {
    socket.on("requestMic", ({deviceId, roomId, channelId}) => {
        console.log(deviceId, "requested mic in room", roomId, "channel", channelId);
    });

    socket.on("releaseMic", ({deviceId, roomId, channelId}) => {
        console.log(deviceId, "released mic in room", roomId, "channel", channelId);
    });
}