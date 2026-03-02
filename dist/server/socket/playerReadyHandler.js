"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerReadyHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const playerReadyHandler = (io, socket) => {
    socket.on("PLAYER_READY", (data, cb) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return cb === null || cb === void 0 ? void 0 : cb(false);
        const room = (0, guards_1.requireRoom)(socket, () => cb === null || cb === void 0 ? void 0 : cb(false));
        if (!room || room.code !== code)
            return;
        const me = (0, guards_1.requireMember)(socket, room, () => cb === null || cb === void 0 ? void 0 : cb(false));
        if (!me)
            return;
        const ready = (0, validation_1.parseBool)(data.ready, false);
        const updated = (0, roomStore_1.setPlayerReady)(code, me.name, ready);
        if (!updated)
            return cb === null || cb === void 0 ? void 0 : cb(false);
        io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
        cb === null || cb === void 0 ? void 0 : cb(true);
    });
};
exports.playerReadyHandler = playerReadyHandler;
