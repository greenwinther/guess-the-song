import type { Server, Socket } from "socket.io";
import {
	initThemeState,
	isRevealed,
	hasLockedThisRound,
	lockPlayerThisRound,
	alreadySolved,
	markSolved,
	normalize,
} from "../../lib/theme";
import { addPointsByCodeName } from "../../lib/score";
import { getRoom as getRoomFromStore } from "../store/roomStore";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	ThemeGuessPayload,
	ThemeRevealPayload,
} from "@/types/socket";
import { parseRoomCode, parseOptionalText } from "../validation";

export const themeGuessHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	// Use playerName to match your lib/game.ts conventions
	socket.on(
		"THEME_GUESS",
		async ({ code, playerName, guess }: ThemeGuessPayload) => {
			const normalizedCode = parseRoomCode(code);
			if (!normalizedCode) return;
			initThemeState(normalizedCode);
			const resolvedName = socket.data.roomMeta?.playerName ?? playerName;

			// Get current theme from in-memory room
			const room = getRoomFromStore(normalizedCode);
			if (!room?.theme) return;

			// No more guesses after reveal
			if (isRevealed(normalizedCode)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName: resolvedName,
					correct: false,
					reason: "revealed",
				});
				return;
			}

			// Already solved permanently
			if (alreadySolved(normalizedCode, resolvedName)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName: resolvedName,
					correct: true,
					alreadySolved: true,
				});
				return;
			}

			// One guess per round
			if (hasLockedThisRound(normalizedCode, resolvedName)) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName: resolvedName,
					correct: false,
					reason: "roundLocked",
				});
				return;
			}

			// Consume their single attempt this round
			lockPlayerThisRound(normalizedCode, resolvedName);

			// 👇 NEW: tell everyone that this player has used their theme guess this round
			io.to(normalizedCode).emit("THEME_GUESSED_THIS_ROUND", { playerName: resolvedName });

			const normalizedGuess = parseOptionalText(guess) ?? "";
			const correct = normalize(normalizedGuess) === normalize(room.theme);
			if (!correct) {
				socket.emit("THEME_GUESS_RESULT", {
					playerName: resolvedName,
					correct: false,
					lockedForRound: true,
				});
				return;
			}

			// First time solved → +1 point, broadcast solved
			markSolved(normalizedCode, resolvedName);
			const newTotal = addPointsByCodeName(normalizedCode, resolvedName, 1);
			io.to(normalizedCode).emit("THEME_SOLVED", { playerName: resolvedName });
			io.to(normalizedCode).emit("scoreUpdated", { playerName: resolvedName, total: newTotal }); // optional but handy
		}
	);

	// Optional: reveal button from host UI
	socket.on("THEME_REVEAL", async ({ code }: ThemeRevealPayload) => {
		const normalizedCode = parseRoomCode(code);
		if (!normalizedCode) return;
		// we don’t need DB here, just flip the flag and broadcast
		const { setRevealed } = await import("@/lib/theme");
		setRevealed(normalizedCode, true);
		io.to(normalizedCode).emit("THEME_REVEALED");
	});
};
