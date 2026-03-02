"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showResultHandler = void 0;
// // src/server/socket/showResultHandler.ts
const game_1 = require("../../lib/game");
const gameState_1 = require("../state/gameState");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const score_1 = require("../logic/score");
const score_2 = require("@/lib/score");
const rooms_1 = require("@/lib/rooms");
const phase_1 = require("../logic/phase");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const showResultHandler = (io, socket) => {
    socket.on("showResults", async (data, callback) => {
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return callback(false);
            const boundRoom = (0, guards_1.requireRoom)(socket, () => callback(false));
            if (!boundRoom)
                return;
            if (boundRoom.code !== code)
                return callback(false);
            if (!(0, guards_1.requireHost)(socket, boundRoom, () => callback(false)))
                return;
            if (!(0, phase_1.isPhase)(boundRoom, ["GUESSING", "RECAP"]))
                return callback(false);
            const room = await (0, rooms_1.getRoom)(code);
            const roundsForCode = (0, game_1.getRoundsForCode)(code);
            const themePoints = (0, score_2.getRoomScores)(code);
            const board = (0, score_1.computeScoreBoard)({
                room,
                rounds: roundsForCode,
                themePointsByPlayer: themePoints,
                hardcoreMultiplier: room.rules.hardcoreMultiplier,
            });
            const finalScores = Object.fromEntries(Object.entries(board.byPlayer).map(([name, row]) => [name, row.total]));
            // 1) cache them
            (0, gameState_1.setFinalScores)(code, finalScores);
            // 2) broadcast the end-of-game
            const updated = (0, roomStore_1.setPhase)(code, "RESULTS");
            io.to(code).emit("gameOver", { scores: finalScores });
            if (updated)
                io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
            callback(true);
        }
        catch (err) {
            console.error("showResults error", err);
            callback(false);
        }
    });
};
exports.showResultHandler = showResultHandler;
