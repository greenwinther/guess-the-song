"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAllOrdersHandler = void 0;
const game_1 = require("../../lib/game");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const phase_1 = require("../logic/phase");
const submitAllOrdersHandler = (io, socket) => {
    socket.on("submitAllOrders", async (data, callback) => {
        var _a, _b;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return callback(false);
            const room = (0, guards_1.requireRoom)(socket, () => callback(false));
            if (!room || room.code !== code)
                return;
            if (!(0, phase_1.isPhase)(room, ["GUESSING", "RECAP"]))
                return callback(false);
            const playerName = (_b = (_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.playerName) !== null && _b !== void 0 ? _b : data.playerName;
            for (const [sid, order] of Object.entries(data.guesses)) {
                (0, game_1.storeOrder)(code, parseInt(sid, 10), playerName, order);
            }
            // === ADD THIS: broadcast that this player has submitted ===
            io.to(code).emit("playerSubmitted", { playerName });
            callback(true);
        }
        catch (err) {
            console.error("submitAllOrders error", err);
            callback(false);
        }
    });
};
exports.submitAllOrdersHandler = submitAllOrdersHandler;
