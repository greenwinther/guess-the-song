"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectOrderHandler = void 0;
const game_1 = require("../../lib/game");
const sharedState_1 = require("../sharedState");
const selectOrderHandler = (io, socket) => {
    socket.on("selectOrder", (data, cb) => {
        try {
            // accept only for active song
            if (sharedState_1.activeSongByRoom[data.code] !== data.songId)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            (0, game_1.storeOrder)(data.code, data.songId, data.playerName, data.order);
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (e) {
            console.error("selectOrder error", e);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.selectOrderHandler = selectOrderHandler;
