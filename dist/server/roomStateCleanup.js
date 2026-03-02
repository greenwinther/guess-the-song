"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRoomState = clearRoomState;
// src/server/roomStateCleanup.ts
const game_1 = require("@/lib/game");
const score_1 = require("@/lib/score");
const theme_1 = require("@/lib/theme");
const gameState_1 = require("./state/gameState");
function clearRoomState(code) {
    (0, game_1.clearRoomRounds)(code);
    (0, score_1.clearRoomScores)(code);
    (0, theme_1.clearThemeState)(code);
    (0, gameState_1.clearRoomGameState)(code);
}
