import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { getRoomGameState } from "@/server/state/gameState";
import { getRoom } from "@/lib/rooms";
import {
	activeRounds,
	detailLockCounts,
	getDetailLockedPlayers,
	getLockedPlayers,
	lockCounts,
	getRoundsForCode,
} from "@/lib/game";
import { getRoomScores } from "@/lib/score";
import { computeScoreBoard } from "@/server/logic/score";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import { toPublicRoom } from "@/server/state/publicRoom";
import {
	getHint,
	getLockedThisRoundList,
	getSolvedList,
	getThemeGuessesThisRound,
	isRevealed,
} from "@/lib/theme";
import { scopedLogger } from "@/server/logger";
import { devResyncPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.resync");

export const resyncHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	const emitLockSnapshots = (code: string) => {
		const roundsForCode = activeRounds[code];
		if (!roundsForCode) return;
		for (const songIdStr of Object.keys(roundsForCode)) {
			const songId = Number(songIdStr);
			const lockedNames = getLockedPlayers(code, songId);
			if (!lockedNames.length) continue;
			const counts = lockCounts(code, songId);
			io.to(code).emit("songFinalized", { songId, mode: "snapshot", counts, lockedNames });
		}
	};
	const emitDetailSnapshots = (code: string) => {
		const roundsForCode = activeRounds[code];
		if (!roundsForCode) return;
		for (const songIdStr of Object.keys(roundsForCode)) {
			const songId = Number(songIdStr);
			const lockedNames = getDetailLockedPlayers(code, songId);
			if (!lockedNames.length) continue;
			const counts = detailLockCounts(code, songId);
			io.to(code).emit("detailFinalized", { songId, mode: "snapshot", counts, lockedNames });
		}
	};

	socket.on("DEV_RESYNC", async (data, cb) => {
		try {
			const payload = validateWithZod(devResyncPayloadSchema, data, {
				errorMessage: "Invalid DEV_RESYNC payload",
			});
			if (!payload.ok) return cb?.(false);
			const code = payload.data.code ?? socket.data.roomMeta?.code ?? "";
			if (!code) return cb?.(false);

			const boundRoom = requireRoom(socket, () => cb?.(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return cb?.(false);
			if (!requireHostOrAdmin(socket, boundRoom, () => cb?.(false))) return;

			const room = await getRoom(code);
			const viewRoom = toPublicRoom(room);
			io.to(code).emit("roomData", viewRoom);

			const gameState = getRoomGameState(code);
			io.to(code).emit("revealedSongs", gameState.revealedSongs || []);
			io.to(code).emit("revealedSubmitters", gameState.revealedSubmitters || []);
			io.to(code).emit("songChanged", { songId: gameState.activeSongId ?? null });

			if (gameState.activeSongId) {
				const locked = getLockedPlayers(code, gameState.activeSongId);
				io.to(code).emit("lockSnapshot", { songId: gameState.activeSongId, locked });
				const detailLocked = getDetailLockedPlayers(code, gameState.activeSongId);
				io.to(code).emit("detailLockSnapshot", { songId: gameState.activeSongId, locked: detailLocked });
			}

			emitLockSnapshots(code);
			emitDetailSnapshots(code);

			const roundsForCode = activeRounds[code];
			if (roundsForCode && Object.keys(roundsForCode).length > 0) {
				io.to(code).emit("gameStarted", viewRoom);
			}

			const hint = getHint(code);
			if (hint) io.to(code).emit("THEME_HINT_READY", { obfuscated: hint });
			if (isRevealed(code)) io.to(code).emit("THEME_REVEALED");
			for (const playerName of getSolvedList(code)) {
				io.to(code).emit("THEME_SOLVED", { playerName });
			}
			const themeGuesses = getThemeGuessesThisRound(code);
			for (const playerName of getLockedThisRoundList(code)) {
				io.to(code).emit("THEME_GUESSED_THIS_ROUND", {
					playerName,
					guess: themeGuesses[playerName],
					lockedForRound: true,
				});
			}

			if (gameState.finalScores) {
				const board = computeScoreBoard({
					room,
					rounds: getRoundsForCode(code),
					themePointsByPlayer: getRoomScores(code),
					guessPoints: room.rules.guessPoints,
					detailGuessPoints: room.rules.detailGuessPoints,
					themeGuessPoints: room.rules.themeGuessPoints,
					hardcoreMultiplier: room.rules.hardcoreMultiplier,
					scoring: room.rules,
				});
				const hostNames = new Set(room.players.filter((player) => player.isHost).map((player) => player.name));
				const tieBreakerStats = Object.fromEntries(
					Object.entries(board.byPlayer)
						.filter(([name]) => !hostNames.has(name))
						.map(([name, row]) => [name, { fastestCorrectLocks: row.fastestCorrectLocks }])
				);
				io.to(code).emit("gameOver", {
					scores: gameState.finalScores,
					tieBreaker: room.rules.tieBreaker,
					tieBreakerStats,
				});
			}

			cb?.(true);
		} catch (err) {
			log.error({ err, code: data?.code }, "DEV_RESYNC error");
			cb?.(false);
		}
	});
};
