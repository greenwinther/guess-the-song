// // src/server/socket/startGameHandler.ts
import { startRoundData } from "../../lib/game";
import { getRoom } from "../../lib/rooms";
import { Server, Socket } from "socket.io";
import { gamesInProgress } from "./sharedState";

export const startGameHandler = (io: Server, socket: Socket) => {
	socket.on("startGame", async (data: { code: string }, callback: (ok: boolean) => void) => {
		try {
			// 1) Fetch the room and its songs
			const room = await getRoom(data.code);
			if (!room) return callback(false);

			// 2) For each song in that room, create a RoundData entry
			//    so that every songId is known up front, with the correctAnswer=submitter
			for (const song of room.songs) {
				// song.id is the unique ID
				// song.submitter is the correct answer for that song
				startRoundData(
					data.code,
					song.id,
					song.submitter,
					room.songs.map((s) => s.submitter)
				);
				// Note: we pass the full list of all submitters, but computeScores only cares about correctAnswer.
			}

			// 3) Broadcast “gameStarted” with the full room so clients can build their guess UI.
			gamesInProgress[data.code] = true;
			io.to(data.code).emit("gameStarted", room);

			callback(true);
		} catch (err: any) {
			console.error("startGame error", err);
			callback(false);
		}
	});
};
