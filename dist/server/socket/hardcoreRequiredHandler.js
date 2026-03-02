"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardcoreRequiredHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const hardcoreRequiredHandler = (io, socket) => {
    socket.on("HARDCORE_REQUIRED", (data, cb) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return cb === null || cb === void 0 ? void 0 : cb(false);
        const room = (0, guards_1.requireRoom)(socket, () => cb === null || cb === void 0 ? void 0 : cb(false));
        if (!room || room.code !== code)
            return;
        if (!(0, guards_1.requireHost)(socket, room, () => cb === null || cb === void 0 ? void 0 : cb(false)))
            return;
        const required = (0, validation_1.parseBool)(data.required, false);
        const updated = (0, roomStore_1.setHardcoreRequired)(code, required);
        if (!updated)
            return cb === null || cb === void 0 ? void 0 : cb(false);
        io.to(code).emit("HARDCORE_REQUIRED_UPDATED", { required });
        io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
        cb === null || cb === void 0 ? void 0 : cb(true);
    });
};
exports.hardcoreRequiredHandler = hardcoreRequiredHandler;
