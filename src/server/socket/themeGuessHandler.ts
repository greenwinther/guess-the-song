import { Server, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import {
	initThemeState,
	isRevealed,
	hasLockedThisRound,
	lockPlayerThisRound,
	alreadySolved,
	markSolved,
	normalize,
} from "@/lib/theme";
import { addPointsByCodeName } from "@/lib/score";

export const themeGuessHandler = (io: Server, socket: Socket) => {
	// Use playerName to match your lib/game.ts conventions
	socket.on(
		"THEME_GUESS",
		async ({ code, playerName, guess }: { code: string; playerName: string; guess: string }) => {
			initThemeState(code);

			// Get current theme from DB
			const room = await prisma.room.findUnique({
				where: { code },
				select: { code: true, theme: true },
			});
			if (!room?.theme) return;

			// No more guesses after reveal
			if (isRevealed(code)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName,
					correct: false,
					reason: "revealed",
				});
				return;
			}

			// Already solved permanently
			if (alreadySolved(code, playerName)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName,
					correct: true,
					alreadySolved: true,
				});
				return;
			}

			// One guess per round
			if (hasLockedThisRound(code, playerName)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName,
					correct: false,
					reason: "roundLocked",
				});
				return;
			}

			// Consume their single attempt this round
			lockPlayerThisRound(code, playerName);

			// 👇 NEW: tell everyone that this player has used their theme guess this round
			io.to(code).emit("THEME_GUESSED_THIS_ROUND", { playerName });

			const correct = normalize(guess) === normalize(room.theme);
			if (!correct) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName,
					correct: false,
					lockedForRound: true,
				});
				return;
			}

			// First time solved → +1 point, broadcast solved
			markSolved(code, playerName);
			const newTotal = addPointsByCodeName(code, playerName, 1);
			io.to(code).emit("THEME_SOLVED", { playerName });
			io.to(code).emit("scoreUpdated", { playerName, total: newTotal }); // optional but handy
		}
	);

	// Optional: reveal button from host UI
	socket.on("THEME_REVEAL", async ({ code }: { code: string }) => {
		// we don’t need DB here, just flip the flag and broadcast
		const { setRevealed } = await import("@/lib/theme");
		setRevealed(code, true);
		io.to(code).emit("THEME_REVEALED");
	});
};
