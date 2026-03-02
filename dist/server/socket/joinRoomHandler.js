"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoomHandler = void 0;
// src/server/socket/joinRoomHandler.ts
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const gameState_1 = require("../state/gameState");
const validation_1 = require("../validation");
const publicRoom_1 = require("../state/publicRoom");
const theme_1 = require("../../lib/theme");
const joinRoomHandler = (io, socket) => {
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
            socket.emit("songFinalized", { songId, mode: "snapshot", counts, lockedNames });
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
            socket.emit("detailFinalized", { songId, mode: "snapshot", counts, lockedNames });
        }
    };
    socket.on("joinRoom", async (data, callback) => {
        var _a, _b, _c, _d, _e, _f;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return callback === null || callback === void 0 ? void 0 : callback(false);
            const name = (0, validation_1.parseName)(data.name, "Player");
            const hardcore = (0, validation_1.parseBool)(data.hardcore, false);
            const avatar = (_a = (0, validation_1.parseAvatarConfig)(data.avatar)) !== null && _a !== void 0 ? _a : undefined;
            const normalizeName = (value) => value.trim().toLowerCase();
            // prevent duplicate joins from same socket, but still send snapshot
            if (((_b = socket.data.roomMeta) === null || _b === void 0 ? void 0 : _b.code) === code &&
                normalizeName((_d = (_c = socket.data.roomMeta) === null || _c === void 0 ? void 0 : _c.playerName) !== null && _d !== void 0 ? _d : "") === normalizeName(name)) {
                const room = await (0, rooms_1.getRoom)(code);
                socket.emit("roomData", (0, publicRoom_1.toPublicRoom)(room));
                const gameState = (0, gameState_1.getRoomGameState)(code);
                socket.emit("revealedSongs", gameState.revealedSongs || []);
                const activeId = (_e = gameState.activeSongId) !== null && _e !== void 0 ? _e : null;
                socket.emit("songChanged", { songId: activeId });
                if (activeId) {
                    const locked = (0, game_1.getLockedPlayers)(code, activeId);
                    socket.emit("lockSnapshot", { songId: activeId, locked });
                    const detailLocked = (0, game_1.getDetailLockedPlayers)(code, activeId);
                    socket.emit("detailLockSnapshot", { songId: activeId, locked: detailLocked });
                }
                emitLockSnapshots(code);
                emitDetailSnapshots(code);
                const hint = (0, theme_1.getHint)(code);
                if (hint)
                    socket.emit("THEME_HINT_READY", { obfuscated: hint });
                if ((0, theme_1.isRevealed)(code))
                    socket.emit("THEME_REVEALED");
                for (const playerName of (0, theme_1.getSolvedList)(code)) {
                    socket.emit("THEME_SOLVED", { playerName });
                }
                for (const playerName of (0, theme_1.getLockedThisRoundList)(code)) {
                    socket.emit("THEME_GUESSED_THIS_ROUND", { playerName });
                }
                if (gameState.finalScores) {
                    socket.emit("gameOver", { scores: gameState.finalScores });
                }
                callback === null || callback === void 0 ? void 0 : callback(true);
                return;
            }
            const { player, created } = await (0, rooms_1.joinRoom)(code, name, hardcore, avatar);
            socket.join(code);
            socket.data.roomMeta = { code, playerName: player.name };
            if (created && player.name !== "Host") {
                io.to(code).emit("playerJoined", player);
            }
            const room = await (0, rooms_1.getRoom)(code);
            socket.emit("roomData", (0, publicRoom_1.toPublicRoom)(room));
            const gameState = (0, gameState_1.getRoomGameState)(code);
            const revealed = gameState.revealedSongs || [];
            socket.emit("revealedSongs", revealed);
            const roundsForCode = game_1.activeRounds[code];
            if (roundsForCode && Object.keys(roundsForCode).length > 0) {
                socket.emit("gameStarted", (0, publicRoom_1.toPublicRoom)(room));
            }
            const activeId = (_f = gameState.activeSongId) !== null && _f !== void 0 ? _f : null;
            socket.emit("songChanged", { songId: activeId });
            if (activeId) {
                const locked = (0, game_1.getLockedPlayers)(code, activeId);
                socket.emit("lockSnapshot", { songId: activeId, locked });
                const detailLocked = (0, game_1.getDetailLockedPlayers)(code, activeId);
                socket.emit("detailLockSnapshot", { songId: activeId, locked: detailLocked });
            }
            emitLockSnapshots(code);
            emitDetailSnapshots(code);
            const hint = (0, theme_1.getHint)(code);
            if (hint)
                socket.emit("THEME_HINT_READY", { obfuscated: hint });
            if ((0, theme_1.isRevealed)(code))
                socket.emit("THEME_REVEALED");
            for (const playerName of (0, theme_1.getSolvedList)(code)) {
                socket.emit("THEME_SOLVED", { playerName });
            }
            for (const playerName of (0, theme_1.getLockedThisRoundList)(code)) {
                socket.emit("THEME_GUESSED_THIS_ROUND", { playerName });
            }
            if (gameState.finalScores) {
                socket.emit("gameOver", { scores: gameState.finalScores });
            }
            callback === null || callback === void 0 ? void 0 : callback(true);
        }
        catch (err) {
            console.error("joinRoom error:", err);
            const reason = err instanceof Error && err.message === "Kicked"
                ? "kicked"
                : err instanceof Error && err.message === "Room closed"
                    ? "closed"
                    : err instanceof Error && err.message === "Room not found"
                        ? "not_found"
                        : "error";
            socket.emit("joinDenied", { reason });
            callback === null || callback === void 0 ? void 0 : callback(false);
        }
    });
};
exports.joinRoomHandler = joinRoomHandler;
