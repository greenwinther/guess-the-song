// src/server/socket/joinRoomHandler.ts
import { activeRounds, getLockedPlayers } from "../../lib/game";
import { getRoom, joinRoom } from "../../lib/rooms";
import { Server, Socket } from "socket.io";
import { activeSongByRoom, finalScoresByRoom, revealedSongsByRoom } from "../sharedState";

export const joinRoomHandler = (io: Server, socket: Socket) => {
	socket.on(
		"joinRoom",
		async (
			data: { code: string; name: string; hardcore?: boolean; clientId?: string },
			callback?: (ok: boolean) => void
		) => {
			try {
				// prevent duplicate joins from same socket
				if (
					socket.data.roomMeta?.code === data.code &&
					socket.data.roomMeta?.playerName === data.name
				) {
					callback?.(true);
					return;
				}

				const { player, created } = await joinRoom(data.code, data.name, !!data.hardcore);
				socket.join(data.code);

				socket.data.roomMeta = { code: data.code, playerName: data.name };

				if (created && player.name !== "Host") {
					io.to(data.code).emit("playerJoined", player);
				}

				const room = await getRoom(data.code);
				socket.emit("roomData", room);

				const revealed = revealedSongsByRoom[data.code] || [];
				socket.emit("revealedSongs", revealed);

				const roundsForCode = activeRounds[data.code];
				if (roundsForCode && Object.keys(roundsForCode).length > 0) {
					socket.emit("gameStarted", room);
				}

				const activeId = activeSongByRoom[data.code] ?? null;
				socket.emit("songChanged", { songId: activeId });
				if (activeId) {
					const locked = getLockedPlayers(data.code, activeId);
					socket.emit("lockSnapshot", { songId: activeId, locked });
				}

				if (finalScoresByRoom[data.code]) {
					socket.emit("gameOver", { scores: finalScoresByRoom[data.code]! });
				}

				callback?.(true);
			} catch (err) {
				console.error("🔔 joinRoom error:", err);
				callback?.(false);
			}
		}
	);
};
