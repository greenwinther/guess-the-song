"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playSongHandler = void 0;
const sharedState_1 = require("../sharedState");
const prisma_1 = require("../../lib/prisma");
const playSongHandler = (io, socket) => {
    socket.on("playSong", async (data, callback) => {
        try {
            // 1) Look up the clip
            const song = await prisma_1.prisma.song.findUnique({ where: { id: data.songId } });
            if (!song) {
                return callback({ success: false, error: "Song not found." });
            }
            // 2) Broadcast the song to everyone in the room
            io.to(data.code).emit("playSong", {
                songId: song.id,
                clipUrl: song.url,
            });
            // 3) Update revealed songs in memory
            if (!sharedState_1.revealedSongsByRoom[data.code]) {
                sharedState_1.revealedSongsByRoom[data.code] = [];
            }
            if (!sharedState_1.revealedSongsByRoom[data.code].includes(data.songId)) {
                sharedState_1.revealedSongsByRoom[data.code].push(data.songId);
            }
            // ✅ 4) Emit updated revealedSongs to sync with all clients
            io.to(data.code).emit("revealedSongs", sharedState_1.revealedSongsByRoom[data.code]);
            callback({ success: true });
        }
        catch (err) {
            console.error("playSong error", err);
            callback({ success: false, error: err.message });
        }
    });
};
exports.playSongHandler = playSongHandler;
