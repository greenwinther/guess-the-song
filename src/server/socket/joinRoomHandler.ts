// src/server/socket/joinRoomHandler.ts
import { activeRounds } from "../../lib/game";
import { getRoom, joinRoom } from "../../lib/rooms";
import { Server, Socket } from "socket.io";
import { finalScoresByRoom, revealedSongsByRoom } from "./sharedState";

export const joinRoomHandler = (io: Server, socket: Socket) => {
	socket.on("joinRoom", async (data: { code: string; name: string }, callback?: (ok: boolean) => void) => {
		try {
			// 1) Add player to room
			const newPlayer = await joinRoom(data.code, data.name);
			socket.join(data.code);

			// 2) Store for disconnect tracking
			socket.data.roomMeta = { code: data.code, playerName: data.name };

			// ✅ Only emit playerJoined if it's not the host
			if (newPlayer.name !== "Host") {
				io.to(data.code).emit("playerJoined", newPlayer);
			}

			// 3) Always send full room data to just this socket
			const room = await getRoom(data.code);
			socket.emit("roomData", room);

			// 4) Also send current revealed songs
			const revealed = revealedSongsByRoom[data.code] || [];
			socket.emit("revealedSongs", revealed);

			// 5) If game already started, tell the client
			const roundsForCode = activeRounds[data.code];
			if (roundsForCode && Object.keys(roundsForCode).length > 0) {
				// Emit gameStarted so that JoinGameClient can flip state.gameStarted = true
				socket.emit("gameStarted", room);
			}

			// 6) If game is over, send final scores
			if (finalScoresByRoom[data.code]) {
				socket.emit("gameOver", {
					scores: finalScoresByRoom[data.code]!,
				});
			}

			if (typeof callback === "function") callback(true);
		} catch (err: any) {
			console.error("🔔 joinRoom error:", err);

			if (typeof callback === "function") callback(false);
		}
	});
};
