"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAllOrdersHandler = void 0;
const game_1 = require("../../lib/game");
const submitAllOrdersHandler = (io, socket) => {
    socket.on("submitAllOrders", async (data, callback) => {
        try {
            for (const [sid, order] of Object.entries(data.guesses)) {
                (0, game_1.storeOrder)(data.code, parseInt(sid, 10), data.playerName, order);
            }
            // === ADD THIS: broadcast that this player has submitted ===
            io.to(data.code).emit("playerSubmitted", { playerName: data.playerName });
            callback(true);
        }
        catch (err) {
            console.error("submitAllOrders error", err);
            callback(false);
        }
    });
};
exports.submitAllOrdersHandler = submitAllOrdersHandler;
