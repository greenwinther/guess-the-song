"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockDetailAnswerHandler = void 0;
const game_1 = require("../../lib/game");
const gameState_1 = require("../state/gameState");
const validation_1 = require("../validation");
const adminDashboard_1 = require("./adminDashboard");
const lockDetailAnswerHandler = (io, socket) => {
    socket.on("lockDetailAnswer", (d, cb) => {
        var _a, _b;
        try {
            const code = (0, validation_1.parseRoomCode)(d.code);
            const songId = (0, validation_1.parseIntSafe)(d.songId);
            if (!code || songId == null)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            if ((0, gameState_1.getRoomGameState)(code).activeSongId !== songId)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const playerName = (_b = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.playerName) !== null && _b !== void 0 ? _b : d.playerName;
            const ok = (0, game_1.manualDetailLock)(code, songId, playerName);
            if (ok) {
                const locked = (0, game_1.getDetailLockedPlayers)(code, songId);
                io.to(code).emit("detailLockSnapshot", { songId, locked });
                void (0, adminDashboard_1.emitAdminDashboardToHosts)(io, code);
            }
            cb === null || cb === void 0 ? void 0 : cb(ok);
        }
        catch (e) {
            console.error("lockDetailAnswer error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
    socket.on("undoDetailLock", (d, cb) => {
        var _a, _b;
        try {
            const code = (0, validation_1.parseRoomCode)(d.code);
            const songId = (0, validation_1.parseIntSafe)(d.songId);
            if (!code || songId == null)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            if ((0, gameState_1.getRoomGameState)(code).activeSongId !== songId)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const playerName = (_b = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.playerName) !== null && _b !== void 0 ? _b : d.playerName;
            const ok = (0, game_1.tryUndoDetailLock)(code, songId, playerName);
            if (ok) {
                const locked = (0, game_1.getDetailLockedPlayers)(code, songId);
                io.to(code).emit("detailLockSnapshot", { songId, locked });
                void (0, adminDashboard_1.emitAdminDashboardToHosts)(io, code);
            }
            cb === null || cb === void 0 ? void 0 : cb(ok);
        }
        catch (e) {
            console.error("undoDetailLock error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.lockDetailAnswerHandler = lockDetailAnswerHandler;
