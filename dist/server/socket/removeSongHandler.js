"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSongHandler = void 0;
// // src/server/socket/removeSongHandler.ts
const rooms_1 = require("../../lib/rooms");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const phase_1 = require("../logic/phase");
const removeSongHandler = (io, socket) => {
    socket.on("removeSong", async (data, callback) => {
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            const songId = (0, validation_1.parseIntSafe)(data.songId);
            if (!code || songId == null)
                return callback({ success: false, error: "Invalid input" });
            const room = (0, guards_1.requireRoom)(socket, () => callback({ success: false, error: "No room" }));
            if (!room || room.code !== code)
                return;
            if (!(0, guards_1.requireHost)(socket, room, () => callback({ success: false, error: "Not host" })))
                return;
            if (!(0, phase_1.isPhase)(room, "LOBBY")) {
                return callback({ success: false, error: "Room not in lobby" });
            }
            const deletedId = await (0, rooms_1.removeSong)(code, songId);
            // Broadcast to everyone in-room that this song is gone
            io.to(code).emit("songRemoved", { songId: deletedId });
            callback({ success: true });
        }
        catch (err) {
            console.error("removeSong error", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            callback({ success: false, error: message });
        }
    });
};
exports.removeSongHandler = removeSongHandler;
