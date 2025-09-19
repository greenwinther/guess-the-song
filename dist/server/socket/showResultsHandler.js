"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showResultHandler = void 0;
// // src/server/socket/showResultHandler.ts
const game_1 = require("../../lib/game");
const sharedState_1 = require("../sharedState");
const showResultHandler = (io, socket) => {
    socket.on("showResults", (data, callback) => {
        try {
            const finalScores = {};
            const roundsForCode = game_1.activeRounds[data.code] || {};
            for (const rd of Object.values(roundsForCode)) {
                const perSong = (0, game_1.computeScores)(rd.orders, rd.correctAnswer);
                for (const [player, pts] of Object.entries(perSong)) {
                    finalScores[player] = (finalScores[player] || 0) + pts;
                }
            }
            // 1) cache them
            sharedState_1.finalScoresByRoom[data.code] = finalScores;
            // 2) broadcast the end-of-game
            io.to(data.code).emit("gameOver", { scores: finalScores });
            callback(true);
        }
        catch (err) {
            console.error("showResults error", err);
            callback(false);
        }
    });
};
exports.showResultHandler = showResultHandler;
