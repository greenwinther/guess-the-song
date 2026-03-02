// src/server/socket/playSongHandler.ts
import type { Server, Socket } from "socket.io";
import { addRevealedSong, getRoomGameState, setActiveSong, setRevealedSongs } from "../state/gameState";
import { getSong } from "../../lib/rooms";
import type { ClientToServerEvents, InterServerEvents, PlaySongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseRoomCode, parseIntSafe } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.playSong");

export const playSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"playSong",
		async (
			data: PlaySongPayload,
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				const code = parseRoomCode(data.code);
				const songId = parseIntSafe(data.songId);
				if (!code || songId == null) return callback({ success: false, error: "Invalid input" });

				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHost(socket, room, () => callback({ success: false, error: "Not host" }))) return;
				if (!isPhase(room, ["GUESSING", "RECAP"])) {
					return callback({ success: false, error: "Room not in game" });
				}

				// 1) Look up the clip
				const song = await getSong(code, songId);
				if (!song) {
					return callback({ success: false, error: "Song not found." });
				}

				// 2) Broadcast the song to everyone in the room
				io.to(code).emit("playSong", {
					songId: song.id,
					clipUrl: song.url,
				});

				// 3) Persist active song so refresh resumes at the same track
				setActiveSong(code, songId);
				io.to(code).emit("songChanged", { songId });

				// 4) Update revealed songs in memory
				addRevealedSong(code, songId);
				const list = getRoomGameState(code).revealedSongs;
				setRevealedSongs(code, list);

				// Step 5: Emit updated revealedSongs to sync with all clients
				io.to(code).emit("revealedSongs", list);

				callback({ success: true });
			} catch (err: unknown) {
				log.error({ err, code: data.code, songId: data.songId }, "playSong error");
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
