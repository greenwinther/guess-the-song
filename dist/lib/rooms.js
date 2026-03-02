"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.getRoom = getRoom;
exports.addSong = addSong;
exports.removeSong = removeSong;
exports.getSong = getSong;
exports.setRoomTheme = setRoomTheme;
const roomStore_1 = require("@/server/store/roomStore");
async function createRoom(theme, backgroundUrl, hostName, avatar) {
    return (0, roomStore_1.createRoom)(theme, backgroundUrl, hostName, avatar);
}
async function joinRoom(code, name, hardcore, avatar) {
    return (0, roomStore_1.joinRoom)(code, name, hardcore, avatar);
}
async function getRoom(code) {
    const room = (0, roomStore_1.getRoom)(code);
    if (!room)
        throw new Error("Room not found");
    return room;
}
async function addSong(code, song) {
    return (0, roomStore_1.addSong)(code, song);
}
async function removeSong(code, songId) {
    return (0, roomStore_1.removeSong)(code, songId);
}
async function getSong(code, songId) {
    return (0, roomStore_1.getSong)(code, songId);
}
async function setRoomTheme(code, theme) {
    return (0, roomStore_1.setRoomTheme)(code, theme);
}
