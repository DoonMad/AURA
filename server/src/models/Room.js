import Channel from "./Channel.js";

const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default class Room {
    constructor(id, adminDeviceId) {
        this.id = id;
        this.admins = [adminDeviceId];
        this.members = [adminDeviceId];
        this.channels = {
            "channel-1": new Channel("channel-1", "Channel 1"),
            "channel-2": new Channel("channel-2", "Channel 2"),
            "channel-3": new Channel("channel-3", "Channel 3"),
            "channel-4": new Channel("channel-4", "Channel 4"),
            "channel-5": new Channel("channel-5", "Channel 5"),
            "channel-6": new Channel("channel-6", "Channel 6"),
            "channel-7": new Channel("channel-7", "Channel 7"),
            "channel-8": new Channel("channel-8", "Channel 8")
        };
    }

    static generateRoomId() {
        let id = "";
        for (let i = 0; i < ROOM_ID_LENGTH; i++) {
            id += ROOM_ID_CHARS.charAt(Math.floor(Math.random() * ROOM_ID_CHARS.length));
        }
        return id;
    }

    addMember(user) {
        if (!this.members.includes(user)) {
            this.members.push(user);
        }
    }

    removeMember(user) {
        this.members = this.members.filter((member) => member !== user);
    }

    getChannel(channelId) {
        return this.channels[channelId];
    }

    addChannel(channel) {
        this.channels[channel.id] = channel;
    }
}