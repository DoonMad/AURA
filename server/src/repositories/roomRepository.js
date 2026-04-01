import Room from "../models/Room.js";

const rooms = new Map();

export function getRoom(roomId) {
    return rooms.get(roomId);
}

export function createRoom(adminDeviceId) {
    let roomId;
    do {
        roomId = Room.generateRoomId();
    } while (rooms.has(roomId));
    const room = new Room(roomId, adminDeviceId);
    rooms.set(roomId, room);
    return room;
}

export function removeRoom(roomId) {
    rooms.delete(roomId);
}
