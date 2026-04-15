export default class Channel {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.members = [];
        this.activeSpeaker = null;
    }

    addMember(deviceId) {
        if (!this.members.includes(deviceId)) {
            this.members.push(deviceId);
        }
    }

    removeMember(deviceId) {
        this.members = this.members.filter((memberId) => memberId !== deviceId);
    }
}
