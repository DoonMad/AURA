export default class User {
    constructor(name, id, roomId, socketId = null) {
        this.name = name;
        this.id = id;
        this.roomId = roomId;
        this.socketId = socketId;
        this.currentChannelId = null;
        this.isSpeaking = false;
    }
}
