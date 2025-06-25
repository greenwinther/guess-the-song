// // src/server/socket/showResultHandler.ts
import { activeRounds, computeScores } from "../../lib/game";
import { Server, Socket } from "socket.io";
import { finalScoresByRoom } from "./sharedState";

export const showResultHandler = (io: Server, socket: Socket) => {
	socket.on("showResults", (data: { code: string }, callback: (ok: boolean) => void) => {
		try {
			const finalScores: Record<string, number> = {};
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
		} catch (err) {
			console.error("showResults error", err);
			callback(false);
		}
	});
};
