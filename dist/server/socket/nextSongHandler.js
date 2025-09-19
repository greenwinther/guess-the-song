"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSongHandler = void 0;
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const sharedState_1 = require("../sharedState"); // adjust path if needed
const nextSongHandler = (io, socket) => {
    socket.on("nextSong", async (data, cb) => {
        var _a;
        try {
            const room = await (0, rooms_1.getRoom)(data.code);
            if (!room)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const current = sharedState_1.activeSongByRoom[data.code];
            if (current != null) {
                const hcNames = await (0, rooms_1.getHardcorePlayerNames)(data.code);
                // 🔒 lock ONLY hardcore players
                const { locked, total } = (0, game_1.finalizeSongForPlayers)(data.code, current, hcNames);
                io.to(data.code).emit("songFinalized", {
                    songId: current,
                    locked,
                    total,
                    mode: "hardcoreOnly",
                });
            }
            // advance
            const ids = room.songs.map((s) => s.id);
            const idx = current != null ? ids.indexOf(current) : -1;
            const nextId = (_a = ids[idx + 1]) !== null && _a !== void 0 ? _a : null;
            sharedState_1.activeSongByRoom[data.code] = nextId;
            io.to(data.code).emit("songChanged", { songId: nextId });
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (e) {
            console.error("nextSong error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.nextSongHandler = nextSongHandler;
