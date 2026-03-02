// // src/server/socket/startGameHandler.ts
import { startRoundData } from "../../lib/game";
import { getRoom } from "../../lib/rooms";
import type { Server, Socket } from "socket.io";
import { setActiveSong, setGameStarted } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, StartGamePayload } from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { toPublicRoom } from "../state/publicRoom";
import { setPhase } from "../store/roomStore";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.startGame");

export const startGameHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("startGame", async (data: StartGamePayload, callback: (ok: boolean) => void) => {
		try {
			const code = parseRoomCode(data.code);
			if (!code) return callback(false);

			const boundRoom = requireRoom(socket, () => callback(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return callback(false);
			if (!requireHost(socket, boundRoom, () => callback(false))) return;

			// 1) Fetch the room and its songs
			const room = await getRoom(code);
			if (!room) return callback(false);
			if (room.songs.length === 0) return callback(false);

			const hasDetailQuestion =
				!!room.detailQuestion &&
				room.songs.length > 0 &&
				room.songs.every((s) => (s.detailAnswer ?? "").trim().length > 0);
			const detailAnswers = hasDetailQuestion
				? room.songs.map((s) => (s.detailAnswer ?? "").trim())
				: [];

			// 2) For each song in that room, create a RoundData entry
			//    so that every songId is known up front, with the correctAnswer=submitter
			for (const song of room.songs) {
				// song.id is the unique ID
				// song.submitter is the correct answer for that song
				startRoundData(
					code,
					song.id,
					song.submitter,
					room.songs.map((s) => s.submitter),
					hasDetailQuestion
						? {
								correctAnswer: (song.detailAnswer ?? "").trim(),
								answers: detailAnswers,
						  }
						: undefined
				);
				// Note: we pass the full list of all submitters, but computeScores only cares about correctAnswer.
			}

			const firstId = room.songs[0]?.id ?? null;
			setActiveSong(code, firstId);

			io.to(code).emit("songChanged", { songId: firstId });
			io.to(code).emit("lockSnapshot", { songId: firstId, locked: [] });
			if (hasDetailQuestion) {
				io.to(code).emit("detailLockSnapshot", { songId: firstId, locked: [] });
			}

			// 3) Broadcast "gameStarted" with the full room so clients can build their guess UI.
			setGameStarted(code, true);
			const updated = setPhase(code, "GUESSING");
			io.to(code).emit("gameStarted", toPublicRoom(updated ?? room));

			callback(true);
		} catch (err: unknown) {
			log.error({ err, code: data.code }, "startGame error");
			callback(false);
		}
	});
};
