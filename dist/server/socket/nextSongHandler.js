"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextSongHandler = void 0;
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const gameState_1 = require("../state/gameState");
const theme_1 = require("../../lib/theme");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const phase_1 = require("../logic/phase");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const nextSongHandler = (io, socket) => {
    socket.on("nextSong", async (data, cb) => {
        var _a;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const boundRoom = (0, guards_1.requireRoom)(socket, () => cb === null || cb === void 0 ? void 0 : cb(false));
            if (!boundRoom)
                return;
            if (boundRoom.code !== code)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            if (!(0, guards_1.requireHost)(socket, boundRoom, () => cb === null || cb === void 0 ? void 0 : cb(false)))
                return;
            const room = await (0, rooms_1.getRoom)(code);
            if (!room)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            if (!(0, phase_1.isPhase)(room, ["GUESSING", "RECAP"]))
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const current = (0, gameState_1.getRoomGameState)(code).activeSongId;
            // Finalize hardcore players for the CURRENT song (unchanged)
            if (current != null) {
                const hcNames = room.players.filter((p) => p.hardcore).map((p) => p.name);
                const { locked, total } = (0, game_1.finalizeSongForPlayers)(code, current, hcNames);
                const names = (0, game_1.getLockedPlayers)(code, current);
                io.to(code).emit("songFinalized", {
                    songId: current,
                    mode: "hardcoreOnly",
                    counts: { locked, total },
                    lockedNames: names, // needed for client-side self lock + counts
                });
                const detailLocked = (0, game_1.finalizeDetailForPlayers)(code, current, hcNames);
                if (detailLocked.total > 0) {
                    const detailNames = (0, game_1.getDetailLockedPlayers)(code, current);
                    io.to(code).emit("detailFinalized", {
                        songId: current,
                        mode: "hardcoreOnly",
                        counts: detailLocked,
                        lockedNames: detailNames,
                    });
                }
            }
            // advance to next song
            const ids = room.songs.map((s) => s.id);
            const idx = current ? ids.indexOf(current) : -1;
            const nextId = (_a = ids[idx + 1]) !== null && _a !== void 0 ? _a : null;
            (0, gameState_1.setActiveSong)(code, nextId);
            io.to(code).emit("songChanged", { songId: nextId });
            if (nextId === null) {
                const updated = (0, roomStore_1.setPhase)(code, "RECAP");
                if (updated)
                    io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
            }
            // 3) THEME side-game integration
            if (nextId !== null) {
                // a) New round → unlock everyone's one guess
                (0, theme_1.clearRoundLocks)(code);
                io.to(code).emit("THEME_ROUND_RESET");
                // b) If the nextId is the LAST song in the list, send the obfuscated hint now
                const isLastSongNow = nextId === ids[ids.length - 1];
                if (isLastSongNow && room.theme) {
                    const obfuscated = (0, theme_1.obfuscateTheme)(room.theme);
                    (0, theme_1.setHint)(code, obfuscated);
                    io.to(code).emit("THEME_HINT_READY", { obfuscated });
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
