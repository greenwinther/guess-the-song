"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeGuessHandler = void 0;
const prisma_1 = require("../../lib/prisma");
const theme_1 = require("../../lib/theme");
const score_1 = require("../../lib/score");
const themeGuessHandler = (io, socket) => {
    // Use playerName to match your lib/game.ts conventions
    socket.on("THEME_GUESS", async ({ code, playerName, guess }) => {
        (0, theme_1.initThemeState)(code);
        // Get current theme from DB
        const room = await prisma_1.prisma.room.findUnique({
            where: { code },
            select: { code: true, theme: true },
        });
        if (!(room === null || room === void 0 ? void 0 : room.theme))
            return;
        // No more guesses after reveal
        if ((0, theme_1.isRevealed)(code)) {
            socket.emit("THEME_GUESS_RESULT", {
                playerName,
                correct: false,
                reason: "revealed",
            });
            return;
        }
        // Already solved permanently
        if ((0, theme_1.alreadySolved)(code, playerName)) {
            socket.emit("THEME_GUESS_RESULT", {
                playerName,
                correct: true,
                alreadySolved: true,
            });
            return;
        }
        // One guess per round
        if ((0, theme_1.hasLockedThisRound)(code, playerName)) {
            socket.emit("THEME_GUESS_RESULT", {
                playerName,
                correct: false,
                reason: "roundLocked",
            });
            return;
        }
        // Consume their single attempt this round
        (0, theme_1.lockPlayerThisRound)(code, playerName);
        // 👇 NEW: tell everyone that this player has used their theme guess this round
        io.to(code).emit("THEME_GUESSED_THIS_ROUND", { playerName });
        const correct = (0, theme_1.normalize)(guess) === (0, theme_1.normalize)(room.theme);
        if (!correct) {
            socket.emit("THEME_GUESS_RESULT", {
                playerName,
                correct: false,
                lockedForRound: true,
            });
            return;
        }
        // First time solved → +1 point, broadcast solved
        (0, theme_1.markSolved)(code, playerName);
        const newTotal = (0, score_1.addPointsByCodeName)(code, playerName, 1);
        io.to(code).emit("THEME_SOLVED", { playerName });
        io.to(code).emit("scoreUpdated", { playerName, total: newTotal }); // optional but handy
    });
    // Optional: reveal button from host UI
    socket.on("THEME_REVEAL", async ({ code }) => {
        // we don’t need DB here, just flip the flag and broadcast
        const { setRevealed } = await Promise.resolve().then(() => __importStar(require("@/lib/theme")));
        setRevealed(code, true);
        io.to(code).emit("THEME_REVEALED");
    });
};
exports.themeGuessHandler = themeGuessHandler;
