import Channel from "./Channel.js";

const ROOM_ID_LENGTH = 6;
const ROOM_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export default class Room {
    constructor(id, adminDeviceId) {
        this.id = id;
        this.admins = [adminDeviceId];
        this.members = [adminDeviceId];
        this.pastMembers = [];
        this.channels = {
            "channel-1": new Channel("channel-1", "Channel 1")
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
        if (!this.pastMembers.includes(user)) {
            this.pastMembers.push(user);
        }
    }

    getChannel(channelId) {
        return this.channels[channelId];
    }

    addChannel(channel) {
        this.channels[channel.id] = channel;
    }
}