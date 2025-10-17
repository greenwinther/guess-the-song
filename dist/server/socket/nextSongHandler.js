"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSongHandler = void 0;
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const sharedState_1 = require("../sharedState");
const theme_1 = require("../../lib/theme");
const nextSongHandler = (io, socket) => {
    socket.on("nextSong", async (data, cb) => {
        var _a;
        try {
            const room = await (0, rooms_1.getRoom)(data.code);
            if (!room)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const current = sharedState_1.activeSongByRoom[data.code];
            // Finalize hardcore players for the CURRENT song (unchanged)
            if (current != null) {
                const hcNames = room.players.filter((p) => p.hardcore).map((p) => p.name);
                const { locked, total } = (0, game_1.finalizeSongForPlayers)(data.code, current, hcNames);
                const names = (0, game_1.getLockedPlayers)(data.code, current);
                io.to(data.code).emit("songFinalized", {
                    songId: current,
                    mode: "hardcoreOnly",
                    counts: { locked, total },
                    lockedNames: names, // needed for client-side self lock + counts
                });
            }
            // advance to next song
            const ids = room.songs.map((s) => s.id);
            const idx = current ? ids.indexOf(current) : -1;
            const nextId = (_a = ids[idx + 1]) !== null && _a !== void 0 ? _a : null;
            sharedState_1.activeSongByRoom[data.code] = nextId;
            io.to(data.code).emit("songChanged", { songId: nextId });
            // 3) THEME side-game integration
            if (nextId !== null) {
                // a) New round → unlock everyone's one guess
                (0, theme_1.clearRoundLocks)(data.code);
                io.to(data.code).emit("THEME_ROUND_RESET");
                // b) If the nextId is the LAST song in the list, send the obfuscated hint now
                const isLastSongNow = nextId === ids[ids.length - 1];
                if (isLastSongNow && room.theme) {
                    const obfuscated = (0, theme_1.obfuscateTheme)(room.theme);
                    (0, theme_1.setHint)(data.code, obfuscated);
                    io.to(data.code).emit("THEME_HINT_READY", { obfuscated });
                }
            }
            // If nextId === null, playlist ended; no new round to unlock.
            // (You could emit THEME_HINT_READY here instead if you prefer it AFTER the list ends.)
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (e) {
            console.error("nextSong error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.nextSongHandler = nextSongHandler;
