import type { Submission } from "@/types/submission";
import type { Server, Socket } from "socket.io";
import { getRoom, updateSong } from "@/lib/rooms";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	UpdateSongPayload,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { getYouTubeID } from "@/lib/youtube";
import { scopedLogger } from "@/server/logger";
import { updateSongPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.updateSong");

export const updateSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"updateSong",
		async (
			data: UpdateSongPayload,
			callback: (res: { success: boolean; song?: Submission; error?: string }) => void
		) => {
			try {
				const payload = validateWithZod(updateSongPayloadSchema, data, {
					errorMessage: "Invalid updateSong payload",
				});
				if (!payload.ok) {
					return callback({
						success: false,
						error: payload.issues[0]?.message ?? payload.error,
					});
				}

				const { songId, code, url, submitter, title, detailAnswer } = payload.data;
				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHost(socket, room, () => callback({ success: false, error: "Not host" }))) return;
				if (!isPhase(room, "LOBBY")) {
					return callback({ success: false, error: "Room not in lobby" });
				}

				const incomingId = getYouTubeID(url);
				if (incomingId) {
					const full = await getRoom(code);
					const duplicate = full.songs.find(
						(song) => song.id !== songId && getYouTubeID(song.url) === incomingId
					);
					if (duplicate) {
						return callback({ success: false, error: "Duplicate song" });
					}
				}

				const song = await updateSong(code, songId, {
					url,
					submitter,
					title,
					detailAnswer: detailAnswer ?? undefined,
				});
				const nextRoom = await getRoom(code);

				log.debug({ code, songId }, "emitting roomData after song update");
				io.to(code).emit("roomData", nextRoom);
				callback({ success: true, song });
			} catch (err: unknown) {
				log.error({ err, code: data.code, songId: data.songId }, "updateSong handler error");
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
