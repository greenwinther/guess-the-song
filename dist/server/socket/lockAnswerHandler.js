"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockAnswerHandler = void 0;
const game_1 = require("../../lib/game");
const sharedState_1 = require("../sharedState");
const lockAnswerHandler = (io, socket) => {
    socket.on("lockAnswer", (d, cb) => {
        try {
            if (sharedState_1.activeSongByRoom[d.code] !== d.songId)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const ok = (0, game_1.manualLock)(d.code, d.songId, d.playerName); // 👈 only this player
            if (ok) {
                io.to(d.code).emit("playerGuessLocked", {
                    songId: d.songId,
                    playerName: d.playerName,
                    counts: (0, game_1.lockCounts)(d.code, d.songId),
                });
            }
            cb === null || cb === void 0 ? void 0 : cb(ok);
        }
        catch (e) {
            console.error("lockAnswer error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
    socket.on("undoLock", (data, cb) => {
        try {
            const ok = (0, game_1.tryUndoManualLock)(data.code, data.songId, data.playerName);
            if (ok) {
                const counts = (0, game_1.lockCounts)(data.code, data.songId);
                io.to(data.code).emit("playerGuessUndo", {
                    playerName: data.playerName,
                    songId: data.songId,
                    counts,
                });
            }
            cb === null || cb === void 0 ? void 0 : cb(ok);
        }
        catch (e) {
            console.error("undoLock error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.lockAnswerHandler = lockAnswerHandler;
