import type { Server, Socket } from "socket.io";
import { addRevealedSong, getRoomGameState, setRevealedSongs } from "@/server/state/gameState";
import { getSong } from "@/lib/rooms";
import type { ClientToServerEvents, InterServerEvents, PlaySongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { scopedLogger } from "@/server/logger";
import { playSongPayloadSchema, validateWithZod } from "@/server/schemas";
import { changeCurrentSong } from "./songNavigation";

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
				const payload = validateWithZod(playSongPayloadSchema, data, {
					errorMessage: "Invalid playSong payload",
				});
				if (!payload.ok) {
					return callback({
						success: false,
						error: payload.issues[0]?.message ?? payload.error,
					});
				}
				const { code, songId } = payload.data;

				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHost(socket, room, () => callback({ success: false, error: "Not host" }))) return;
				if (!isPhase(room, ["GUESSING", "RECAP", "REVEAL"])) {
					return callback({ success: false, error: "Room not in game" });
				}

				// 1) Look up the clip
				const song = await getSong(code, songId);
				if (!song) {
					return callback({ success: false, error: "Song not found." });
				}

				const current = getRoomGameState(code).activeSongId;
				const changed = changeCurrentSong(io, room, current, song.id);
				if (!changed.ok && changed.reason !== "NO_CHANGE") {
					return callback({ success: false, error: "Song transition blocked." });
				}

				// 2) Broadcast the song to everyone in the room
				io.to(code).emit("playSong", {
					songId: song.id,
					clipUrl: song.url,
				});

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
