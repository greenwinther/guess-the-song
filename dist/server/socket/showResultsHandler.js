// // src/server/socket/showResultHandler.ts
import { activeRounds, computeScores } from "@/lib/game";
import { finalScoresByRoom } from "./sharedState";
export const showResultHandler = (io, socket) => {
    socket.on("showResults", (data, callback) => {
        try {
            const finalScores = {};
            const roundsForCode = activeRounds[data.code] || {};
            for (const rd of Object.values(roundsForCode)) {
                const perSong = computeScores(rd.orders, rd.correctAnswer);
                for (const [player, pts] of Object.entries(perSong)) {
                    finalScores[player] = (finalScores[player] || 0) + pts;
                }
            }
            // 1) cache them
            finalScoresByRoom[data.code] = finalScores;
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
