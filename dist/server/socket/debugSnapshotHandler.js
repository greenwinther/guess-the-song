"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugSnapshotHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const rooms_1 = require("../../lib/rooms");
const publicRoom_1 = require("../state/publicRoom");
const gameState_1 = require("../state/gameState");
const game_1 = require("@/lib/game");
const theme_1 = require("@/lib/theme");
const score_1 = require("@/lib/score");
const debugSnapshotHandler = (io, socket) => {
    socket.on("DEV_SNAPSHOT", async (data, cb) => {
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
            const snapshot = {
                room: (0, publicRoom_1.toPublicRoom)(room),
                gameState: (0, gameState_1.getRoomGameState)(code),
                rounds: (_d = (0, game_1.exportRoundsState)()[code]) !== null && _d !== void 0 ? _d : {},
                theme: (0, theme_1.exportThemeState)(),
                scores: (0, score_1.getRoomScores)(code),
                timestamp: Date.now(),
            };
            console.log("[debug snapshot]", JSON.stringify(snapshot, null, 2));
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (err) {
            console.error("DEV_SNAPSHOT error", err);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.debugSnapshotHandler = debugSnapshotHandler;
