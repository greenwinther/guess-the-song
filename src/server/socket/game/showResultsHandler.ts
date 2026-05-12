import type { Server, Socket } from "socket.io";
import {
	finalizeDetailForPlayers,
	finalizeSongForPlayers,
	getDetailLockedPlayers,
	getLockedPlayers,
} from "@/lib/game";
import {
	getRoomGameState,
	setActiveSong,
	setFinalScores,
	setRevealedSubmitters,
} from "@/server/state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	ShowResultsPayload,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { getRoom } from "@/lib/rooms";
import { isPhase } from "@/server/logic/phase";
import { setPhase } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { scopedLogger } from "@/server/logger";
import { showResultsPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.showResults");

export const showResultHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("showResults", async (data: ShowResultsPayload, callback: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(showResultsPayloadSchema, data, {
				errorMessage: "Invalid showResults payload",
			});
			if (!payload.ok) return callback(false);
			const { code } = payload.data;

			const boundRoom = requireRoom(socket, () => callback(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return callback(false);
			if (!requireHost(socket, boundRoom, () => callback(false))) return;
			if (!isPhase(boundRoom, ["RECAP", "REVEAL"])) return callback(false);

			const room = await getRoom(code);
			if (!room.songs.length) return callback(false);
			const updated = setPhase(code, "REVEAL");
			if (updated) io.to(code).emit("roomData", toPublicRoom(updated));

			const players = room.players.filter((player) => !player.isHost).map((player) => player.name);
			for (const song of room.songs) {
				const submitterLocks = finalizeSongForPlayers(code, song.id, players, {
					multiplierEligible: false,
				});
				const lockedNames = getLockedPlayers(code, song.id);
				io.to(code).emit("songFinalized", {
					songId: song.id,
					mode: "snapshot",
					counts: submitterLocks,
					lockedNames,
				});
				const detailLocks = finalizeDetailForPlayers(code, song.id, players, {
					multiplierEligible: false,
				});
				if (detailLocks.total > 0) {
					io.to(code).emit("detailFinalized", {
						songId: song.id,
						mode: "snapshot",
						counts: detailLocks,
						lockedNames: getDetailLockedPlayers(code, song.id),
					});
				}
			}

			// Enter reveal phase; final scoring happens when reveal playback reaches the end.
			setFinalScores(code, null);
			const existingRevealed = getRoomGameState(code).revealedSubmitters ?? [];
			setRevealedSubmitters(code, boundRoom.phase === "REVEAL" ? existingRevealed : []);
			io.to(code).emit("revealedSubmitters", getRoomGameState(code).revealedSubmitters ?? []);
			const firstSongId = room.songs[0]?.id ?? null;
			setActiveSong(code, firstSongId);
			io.to(code).emit("songChanged", { songId: firstSongId });
			callback(true);
		} catch (err) {
			log.error({ err, code: data.code }, "showResults error");
			callback(false);
		}
	});
};
