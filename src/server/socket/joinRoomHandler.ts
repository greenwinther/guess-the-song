// src/server/socket/joinRoomHandler.ts
import { activeRounds } from "@/lib/game";
import { getRoom, joinRoom } from "@/lib/rooms";
import { Server, Socket } from "socket.io";
import { finalScoresByRoom, revealedSongsByRoom } from "./sharedState";

export const joinRoomHandler = (io: Server, socket: Socket) => {
	socket.on("joinRoom", async (data: { code: string; name: string }, callback?: (ok: boolean) => void) => {
		try {
			// …persist the newPlayer, join the socket…
			const newPlayer = await joinRoom(data.code, data.name);
			socket.join(data.code);

			// Store room + playerName on socket.data so we know, on disconnect, who to remove
			socket.data.roomMeta = { code: data.code, playerName: data.name };
			io.to(data.code).emit("playerJoined", newPlayer);

			// 1) Always send the freshest Room to this socket
			const room = await getRoom(data.code);
			io.to(data.code).emit("playerJoined", newPlayer);
			socket.emit("roomData", room);

			const revealed = revealedSongsByRoom[data.code] || [];
			socket.emit("revealedSongs", revealed);

			// 2) If a round is already active, immediately tell them the game has started
			const roundsForCode = activeRounds[data.code];
			if (roundsForCode && Object.keys(roundsForCode).length > 0) {
				// Emit gameStarted so that JoinGameClient can flip state.gameStarted = true
				socket.emit("gameStarted", room);
			}

			// 3) If the game is over already, send results
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
