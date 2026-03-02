"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoom = requireRoom;
exports.requireMember = requireMember;
exports.requireHost = requireHost;
const roomStore_1 = require("../store/roomStore");
function requireRoom(socket, onError) {
    var _a;
    const code = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.code;
    if (!code) {
        onError === null || onError === void 0 ? void 0 : onError("NO_ROOM");
        return null;
    }
    const room = (0, roomStore_1.getRoom)(code);
    if (!room) {
        onError === null || onError === void 0 ? void 0 : onError("NO_ROOM");
        return null;
    }
    return room;
}
function requireMember(socket, room, onError) {
    var _a, _b;
    const playerName = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.playerName;
    if (!playerName) {
        onError === null || onError === void 0 ? void 0 : onError("NO_MEMBER");
        return null;
    }
    const member = (_b = room.players.find((p) => p.name === playerName)) !== null && _b !== void 0 ? _b : null;
    if (!member) {
        onError === null || onError === void 0 ? void 0 : onError("NO_MEMBER");
        return null;
    }
    return member;
}
function requireHost(socket, room, onError) {
    const me = requireMember(socket, room, onError);
    if (!me)
        return null;
    if (!me.isHost) {
        onError === null || onError === void 0 ? void 0 : onError("NOT_HOST");
        return null;
    }
    return me;
}
