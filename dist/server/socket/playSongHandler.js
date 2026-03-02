"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playSongHandler = void 0;
const gameState_1 = require("../state/gameState");
const rooms_1 = require("../../lib/rooms");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const phase_1 = require("../logic/phase");
const playSongHandler = (io, socket) => {
    socket.on("playSong", async (data, callback) => {
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
            if (!(0, phase_1.isPhase)(room, ["GUESSING", "RECAP"])) {
                return callback({ success: false, error: "Room not in game" });
            }
            // 1) Look up the clip
            const song = await (0, rooms_1.getSong)(code, songId);
            if (!song) {
                return callback({ success: false, error: "Song not found." });
            }
            // 2) Broadcast the song to everyone in the room
            io.to(code).emit("playSong", {
                songId: song.id,
                clipUrl: song.url,
            });
            // 3) Persist active song so refresh resumes at the same track
            (0, gameState_1.setActiveSong)(code, songId);
            io.to(code).emit("songChanged", { songId });
            // 4) Update revealed songs in memory
            (0, gameState_1.addRevealedSong)(code, songId);
            const list = (0, gameState_1.getRoomGameState)(code).revealedSongs;
            (0, gameState_1.setRevealedSongs)(code, list);
            // Step 5: Emit updated revealedSongs to sync with all clients
            io.to(code).emit("revealedSongs", list);
            callback({ success: true });
        }
        catch (err) {
            console.error("playSong error", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            callback({ success: false, error: message });
        }
    });
};
exports.playSongHandler = playSongHandler;
