"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resyncHandler = void 0;
const gameState_1 = require("../state/gameState");
const rooms_1 = require("../../lib/rooms");
const game_1 = require("../../lib/game");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const publicRoom_1 = require("../state/publicRoom");
const theme_1 = require("../../lib/theme");
const resyncHandler = (io, socket) => {
    const emitLockSnapshots = (code) => {
        const roundsForCode = game_1.activeRounds[code];
        if (!roundsForCode)
            return;
        for (const songIdStr of Object.keys(roundsForCode)) {
            const songId = Number(songIdStr);
            const lockedNames = (0, game_1.getLockedPlayers)(code, songId);
            if (!lockedNames.length)
                continue;
            const counts = (0, game_1.lockCounts)(code, songId);
            io.to(code).emit("songFinalized", { songId, mode: "snapshot", counts, lockedNames });
        }
    };
    const emitDetailSnapshots = (code) => {
        const roundsForCode = game_1.activeRounds[code];
        if (!roundsForCode)
            return;
        for (const songIdStr of Object.keys(roundsForCode)) {
            const songId = Number(songIdStr);
            const lockedNames = (0, game_1.getDetailLockedPlayers)(code, songId);
            if (!lockedNames.length)
                continue;
            const counts = (0, game_1.detailLockCounts)(code, songId);
            io.to(code).emit("detailFinalized", { songId, mode: "snapshot", counts, lockedNames });
        }
    };
    socket.on("DEV_RESYNC", async (data, cb) => {
        var _a, _b, _c, _d;
        try {
            const code = (0, validation_1.parseRoomCode)((_c = (_a = data === null || data === void 0 ? void 0 : data.code) !== null && _a !== void 0 ? _a : (_b = socket.data.roomMeta) === null || _b === void 0 ? void 0 : _b.code) !== null && _c !== void 0 ? _c : "");
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
            const viewRoom = (0, publicRoom_1.toPublicRoom)(room);
            io.to(code).emit("roomData", viewRoom);
            const gameState = (0, gameState_1.getRoomGameState)(code);
            io.to(code).emit("revealedSongs", gameState.revealedSongs || []);
            io.to(code).emit("songChanged", { songId: (_d = gameState.activeSongId) !== null && _d !== void 0 ? _d : null });
            if (gameState.activeSongId) {
                const locked = (0, game_1.getLockedPlayers)(code, gameState.activeSongId);
                io.to(code).emit("lockSnapshot", { songId: gameState.activeSongId, locked });
                const detailLocked = (0, game_1.getDetailLockedPlayers)(code, gameState.activeSongId);
                io.to(code).emit("detailLockSnapshot", { songId: gameState.activeSongId, locked: detailLocked });
            }
            emitLockSnapshots(code);
            emitDetailSnapshots(code);
            const roundsForCode = game_1.activeRounds[code];
            if (roundsForCode && Object.keys(roundsForCode).length > 0) {
                io.to(code).emit("gameStarted", viewRoom);
            }
            const hint = (0, theme_1.getHint)(code);
            if (hint)
                io.to(code).emit("THEME_HINT_READY", { obfuscated: hint });
            if ((0, theme_1.isRevealed)(code))
                io.to(code).emit("THEME_REVEALED");
            for (const playerName of (0, theme_1.getSolvedList)(code)) {
                io.to(code).emit("THEME_SOLVED", { playerName });
            }
            for (const playerName of (0, theme_1.getLockedThisRoundList)(code)) {
                io.to(code).emit("THEME_GUESSED_THIS_ROUND", { playerName });
            }
            if (gameState.finalScores) {
                io.to(code).emit("gameOver", { scores: gameState.finalScores });
            }
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (err) {
            console.error("DEV_RESYNC error", err);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.resyncHandler = resyncHandler;
