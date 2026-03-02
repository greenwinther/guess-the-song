"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = void 0;
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const disconnectHandler = (io, socket) => {
    socket.on("disconnect", async (reason) => {
        console.log("↔️ socket disconnected", socket.id, reason);
        const meta = socket.data.roomMeta;
        if (!meta)
            return;
        const { code, playerName } = meta;
        try {
            const before = (0, roomStore_1.getRoom)(code);
            if (!before)
                return;
            const updated = (0, roomStore_1.setPlayerConnected)(code, playerName, false);
            if (updated) {
                io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
            }
        }
        catch (err) {
            console.error("[disconnect] cleanup error", err);
        }
    });
};
exports.disconnectHandler = disconnectHandler;
