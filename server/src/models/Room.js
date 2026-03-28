import Channel from "./Channel";

const generateRoomId = () => {

}

export default class Room {
    constructor(id, adminDeviceId) {
        this.id = id;
        this.admins = [adminDeviceId];
        this.members = [adminDeviceId];
        this.pastMembers = [];
        this.channels = {
            "channel-1": new Channel("channel-1", "Channel 1")
        }
    }

    static generateRoomId() {
        
    }

    addMember(user) {
        this.members.push(user);
    }

    removeMember(user) {
        this.members.pop(user);
    }

    getChannel(channelId) {
        return this.channels[channelId];
    }

    addChannel(channel) {
        this.channels[channel.id] = channel;
    }
}