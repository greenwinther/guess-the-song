import type { Server, Socket } from "socket.io";
import { getRoom } from "@/lib/rooms";
import { getRoomGameState, setRevealedSubmitters } from "@/server/state/gameState";
import { clearRoundLocks, obfuscateTheme, setHint } from "@/lib/theme";
import type { ClientToServerEvents, InterServerEvents, NextSongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { setPhase } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { scopedLogger } from "@/server/logger";
import { nextSongPayloadSchema, validateWithZod } from "@/server/schemas";
import { changeCurrentSong } from "./songNavigation";
import { computeScoreBoard } from "@/server/logic/score";
import { getRoundsForCode } from "@/lib/game";
import { getRoomScores } from "@/lib/score";
import { setFinalScores } from "@/server/state/gameState";

const log = scopedLogger("socket.nextSong");

export const nextSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("nextSong", async (data: NextSongPayload, cb?: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(nextSongPayloadSchema, data, {
				errorMessage: "Invalid nextSong payload",
			});
			if (!payload.ok) return cb?.(false);
			const { code } = payload.data;

			const boundRoom = requireRoom(socket, () => cb?.(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return cb?.(false);
			if (!requireHost(socket, boundRoom, () => cb?.(false))) return;

			const room = await getRoom(code);
			if (!room) return cb?.(false);
			if (!isPhase(room, ["GUESSING", "RECAP", "REVEAL"])) return cb?.(false);

			const current = getRoomGameState(code).activeSongId;

			// advance to next song
			const ids = room.songs.map((s) => s.id);
			const idx = current ? ids.indexOf(current) : -1;
			const nextId = ids[idx + 1] ?? null;
			const changed = changeCurrentSong(io, room, current, nextId);
			if (!changed.ok) {
				if (changed.reason === "NO_CHANGE") return cb?.(true);
				return cb?.(false);
			}

			if (nextId === null && room.phase !== "REVEAL") {
				const updated = setPhase(code, "RECAP");
				if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
			}
			if (nextId === null && room.phase === "REVEAL") {
				const roundsForCode = getRoundsForCode(code);
				const themePoints = getRoomScores(code);
				const board = computeScoreBoard({
					room,
					rounds: roundsForCode,
					themePointsByPlayer: themePoints,
					guessPoints: room.rules.guessPoints,
					detailGuessPoints: room.rules.detailGuessPoints,
					themeGuessPoints: room.rules.themeGuessPoints,
					hardcoreMultiplier: room.rules.hardcoreMultiplier,
					scoring: room.rules,
				});
				const hostNames = new Set(room.players.filter((player) => player.isHost).map((player) => player.name));
				const finalScores = Object.fromEntries(
					Object.entries(board.byPlayer)
						.filter(([name]) => !hostNames.has(name))
						.map(([name, row]) => [name, row.total]),
				);
				const tieBreakerStats = Object.fromEntries(
					Object.entries(board.byPlayer)
						.filter(([name]) => !hostNames.has(name))
						.map(([name, row]) => [name, { fastestCorrectLocks: row.fastestCorrectLocks }]),
				);

				setFinalScores(code, finalScores);
				const allSongIds = room.songs.map((song) => song.id);
				setRevealedSubmitters(code, allSongIds);
				const updated = setPhase(code, "RESULTS");
				io.to(code).emit("gameOver", {
					scores: finalScores,
					tieBreaker: room.rules.tieBreaker,
					tieBreakerStats,
				});
				io.to(code).emit("revealedSubmitters", allSongIds);
				if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
			}

			// 3) THEME side-game integration
			if (nextId !== null && room.phase === "GUESSING") {
				// a) New round → unlock everyone's one guess
				clearRoundLocks(code);
				io.to(code).emit("THEME_ROUND_RESET");

				// b) If the nextId is the LAST song in the list, send the obfuscated hint now
				const isLastSongNow = nextId === ids[ids.length - 1];
				if (isLastSongNow && room.theme) {
					const obfuscated = obfuscateTheme(room.theme);
					setHint(code, obfuscated);
					io.to(code).emit("THEME_HINT_READY", { obfuscated });
				}
			}
			// If nextId === null, playlist ended; no new round to unlock.
			// (You could emit THEME_HINT_READY here instead if you prefer it AFTER the list ends.)

			cb?.(true);
		} catch (e) {
			log.error({ err: e, code: data.code }, "nextSong error");
			cb?.(false);
		}
	});
};
