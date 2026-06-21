import type { Server, Socket } from "socket.io";
import { getRoundsForCode } from "@/lib/game";
import {
	getSongGuessStatsPayloadSchema,
	validateWithZod,
} from "@/server/schemas";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import type {
	ClientToServerEvents,
	GetSongGuessStatsPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	SongGuessStats,
} from "@/types/socket";

const buildSongGuessStats = (code: string, songIds: number[], playerNames: string[]): SongGuessStats[] => {
	const rounds = getRoundsForCode(code);

	return songIds.map((songId) => {
		const round = rounds[songId];
		const correctGuessers: string[] = [];
		const wrongCounts = new Map<string, number>();
		let guessedCount = 0;
		let noAnswerCount = 0;

		for (const playerName of playerNames) {
			const guess = round?.orders[playerName]?.[0] ?? "";
			if (!guess) {
				noAnswerCount++;
				continue;
			}
			guessedCount++;
			if (guess === round?.correctAnswer) {
				correctGuessers.push(playerName);
				continue;
			}
			wrongCounts.set(guess, (wrongCounts.get(guess) ?? 0) + 1);
		}

		const commonWrongGuesses = Array.from(wrongCounts.entries())
			.map(([guess, count]) => ({ guess, count }))
			.sort((a, b) => b.count - a.count || a.guess.localeCompare(b.guess))
			.slice(0, 3);

		return {
			songId,
			totalPlayers: playerNames.length,
			guessedCount,
			correctGuessers,
			wrongCount: guessedCount - correctGuessers.length,
			noAnswerCount,
			commonWrongGuesses,
		};
	});
};

export const songGuessStatsHandler = (
	_io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("getSongGuessStats", (data: GetSongGuessStatsPayload, cb) => {
		const payload = validateWithZod(getSongGuessStatsPayloadSchema, data, {
			errorMessage: "Invalid getSongGuessStats payload",
		});
		if (!payload.ok) return cb({ ok: false, error: "BAD_REQUEST" });
		const { code } = payload.data;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return cb({ ok: false, error: "ROOM_NOT_FOUND" });
		if (!requireHostOrAdmin(socket, room)) {
			return cb({ ok: false, error: "NOT_AUTHORIZED" });
		}

		const songIds = room.songs.map((song) => song.id);
		const playerNames = room.players.filter((player) => !player.isHost).map((player) => player.name);
		cb({ ok: true, stats: buildSongGuessStats(code, songIds, playerNames) });
	});
};
