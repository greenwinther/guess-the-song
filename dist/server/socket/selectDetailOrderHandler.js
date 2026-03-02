"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectDetailOrderHandler = void 0;
const game_1 = require("../../lib/game");
const gameState_1 = require("../state/gameState");
const validation_1 = require("../validation");
const adminDashboard_1 = require("./adminDashboard");
const selectDetailOrderHandler = (io, socket) => {
    socket.on("selectDetailOrder", (data, cb) => {
        var _a, _b;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            const songId = (0, validation_1.parseIntSafe)(data.songId);
            if (!code || songId == null)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            if ((0, gameState_1.getRoomGameState)(code).activeSongId !== songId)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const playerName = (_b = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.playerName) !== null && _b !== void 0 ? _b : data.playerName;
            (0, game_1.storeDetailOrder)(code, songId, playerName, data.order);
            void (0, adminDashboard_1.emitAdminDashboardToHosts)(io, code);
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (e) {
            console.error("selectDetailOrder error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.selectDetailOrderHandler = selectDetailOrderHandler;
