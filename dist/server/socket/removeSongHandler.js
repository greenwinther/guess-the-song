"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSongHandler = void 0;
// // src/server/socket/removeSongHandler.ts
const rooms_1 = require("../../lib/rooms");
const removeSongHandler = (io, socket) => {
    socket.on("removeSong", async (data, callback) => {
        try {
            const deletedId = await (0, rooms_1.removeSong)(data.code, data.songId);
            // Broadcast to everyone in-room that this song is gone
            io.to(data.code).emit("songRemoved", { songId: deletedId });
            callback({ success: true });
        }
        catch (err) {
            console.error("removeSong error", err);
            callback({ success: false, error: err.message });
        }
    });
};
exports.removeSongHandler = removeSongHandler;
