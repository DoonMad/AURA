import User from "../models/User.js";

const users = new Map();

export function getUser(deviceId) {
    return users.get(deviceId);
}

export function getUserBySocketId(socketId) {
    return Array.from(users.values()).find((user) => user.socketId === socketId);
}

export function createUser(deviceId, displayName, roomId, socketId = null) {
    let user = users.get(deviceId);
    if (user) {
        user.name = displayName;
        user.roomId = roomId;
        user.socketId = socketId;
        user.currentChannelId = null;
        user.isSpeaking = false;
    } 
    else {
        user = new User(displayName, deviceId, roomId, socketId);
        users.set(deviceId, user);
    }
}

export function removeUser(deviceId) {
    users.delete(deviceId);
}

export function getUsersInRoom(roomId) {
    return Array.from(users.values()).filter(user => user.roomId === roomId);
}
