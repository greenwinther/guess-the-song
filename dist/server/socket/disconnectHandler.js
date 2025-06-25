"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const disconnectHandler = (io, socket) => {
    socket.on("disconnect", async (reason) => {
        console.log("↔️ socket disconnected", socket.id);
        console.log(`↔️ socket ${socket.id} disconnected:`, reason);
        // If we had stored room+playerName in socket.data, remove them now:
        const meta = socket.data.roomMeta;
        if (meta) {
            const { code, playerName } = meta;
            try {
                const updated = await (0, rooms_1.getRoom)(code);
                io.to(code).emit("roomData", updated);
            }
            catch (err) {
                console.error("[disconnect] cleanup error", err);
            }
        }
    });
};
exports.disconnectHandler = disconnectHandler;
