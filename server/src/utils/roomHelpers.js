export function isRoomAdmin(room, deviceId) {
    if (!room || !deviceId) {
        return false;
    }

    return Array.isArray(room.admins) && room.admins.includes(deviceId);
}

export function removeMemberFromRoomState(room, deviceId) {
    if (!room || !deviceId) {
        return;
    }

    room.removeMember(deviceId);

    for (const channel of Object.values(room.channels)) {
        channel.removeMember(deviceId);
        if (channel.activeSpeaker === deviceId) {
            channel.activeSpeaker = null;
        }
    }
}

export function getRoomAdminId(room) {
    if (!room || !Array.isArray(room.admins) || room.admins.length === 0) {
        return null;
    }

    return room.admins[0];
}
