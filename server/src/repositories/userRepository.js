import User from "../models/User.js";

const users = new Map();

export function getUser(deviceId) {
    return users.get(deviceId);
}

export function createUser(deviceId, displayName, roomId) {
    let user = users.get(deviceId);
    if (user) {
        user.roomId = roomId;
    } 
    else {
        user = new User(displayName, deviceId, roomId);
        users.set(deviceId, user);
    }
}

export function removeUser(deviceId) {
    users.delete(deviceId);
}

export function getUsersInRoom(roomId) {
    return Array.from(users.values()).filter(user => user.roomId === roomId);
}
