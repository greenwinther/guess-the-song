import type { Server, Socket } from "socket.io";
import {
	initThemeState,
	isRevealed,
	hasLockedThisRound,
	lockPlayerThisRound,
	alreadySolved,
	markSolved,
	normalize,
	storeThemeGuessThisRound,
} from "@/lib/theme";
import { storeThemeGuess } from "@/lib/game";
import { addPointsByCodeName } from "@/lib/score";
import { getRoom as getRoomFromStore } from "@/server/store/roomStore";
import { getRoomGameState } from "@/server/state/gameState";
import { emitAdminDashboardToHosts } from "@/server/socket/admin/adminDashboard";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	ThemeGuessPayload,
	ThemeRevealPayload,
} from "@/types/socket";
import { requireHost, requireNonHostMember, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { themeGuessPayloadSchema, themeRevealPayloadSchema, validateWithZod } from "@/server/schemas";

export const themeGuessHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	// Use playerName to match your lib/game.ts conventions
	socket.on("THEME_GUESS", async (data: ThemeGuessPayload) => {
		const payload = validateWithZod(themeGuessPayloadSchema, data, {
			errorMessage: "Invalid THEME_GUESS payload",
		});
		if (!payload.ok) return;
		const { code: normalizedCode, guess } = payload.data;

		const boundRoom = requireRoom(socket);
		if (!boundRoom || boundRoom.code !== normalizedCode) return;
		if (!isPhase(boundRoom, ["GUESSING", "RECAP"])) return;
		const member = requireNonHostMember(socket, boundRoom);
		if (!member) return;

		initThemeState(normalizedCode);
		const resolvedName = member.name;

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
		storeThemeGuessThisRound(normalizedCode, resolvedName, guess);
		const activeSongId = getRoomGameState(normalizedCode).activeSongId;
		if (activeSongId != null) {
			storeThemeGuess(normalizedCode, activeSongId, resolvedName, guess);
		}
		io.to(normalizedCode).emit("THEME_GUESSED_THIS_ROUND", { playerName: resolvedName, guess });
		void emitAdminDashboardToHosts(io, normalizedCode);

		const correct = normalize(guess) === normalize(room.theme);
		if (!correct) {
			socket.emit("THEME_GUESS_RESULT", {
				playerName: resolvedName,
				correct: false,
				lockedForRound: true,
			});
			return;
		}

		// First time solved -> +1 point, broadcast solved
		markSolved(normalizedCode, resolvedName);
		const newTotal = addPointsByCodeName(normalizedCode, resolvedName, 1);
		io.to(normalizedCode).emit("THEME_SOLVED", { playerName: resolvedName });
		io.to(normalizedCode).emit("scoreUpdated", { playerName: resolvedName, total: newTotal });
		void emitAdminDashboardToHosts(io, normalizedCode);
	});

	// Optional: reveal button from host UI
	socket.on("THEME_REVEAL", async (data: ThemeRevealPayload) => {
		const payload = validateWithZod(themeRevealPayloadSchema, data, {
			errorMessage: "Invalid THEME_REVEAL payload",
		});
		if (!payload.ok) return;
		const { code: normalizedCode } = payload.data;
		const boundRoom = requireRoom(socket);
		if (!boundRoom || boundRoom.code !== normalizedCode) return;
		if (!requireHost(socket, boundRoom)) return;
		if (!isPhase(boundRoom, "RESULTS")) return;

		const { setRevealed } = await import("@/lib/theme");
		setRevealed(normalizedCode, true);
		io.to(normalizedCode).emit("THEME_REVEALED");
	});
};
