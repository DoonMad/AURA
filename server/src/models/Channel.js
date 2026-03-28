export default class Channel {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.members = [];
        this.activeSpeaker = null;
    }

    addMember(user) {
        this.members.push(user.id)
    }

    removeMember(user) {
        this.members.pop(user.id)
    }
}