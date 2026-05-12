import type { Submission } from "@/types/submission";
import type { Server, Socket } from "socket.io";
import { addSong, getRoom } from "@/lib/rooms";
import type { AddSongPayload, ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { getYouTubeID } from "@/lib/youtube";
import { scopedLogger } from "@/server/logger";
import { addSongPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.addSong");

export const addSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"addSong",
		async (
			data: AddSongPayload,
			callback: (res: { success: boolean; song?: Submission; error?: string }) => void
		) => {
			try {
				const payload = validateWithZod(addSongPayloadSchema, data, {
					errorMessage: "Invalid addSong payload",
				});
				if (!payload.ok) {
					return callback({
						success: false,
						error: payload.issues[0]?.message ?? payload.error,
					});
				}
				const { code, url, submitter, title, detailAnswer } = payload.data;

				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHostOrAdmin(socket, room, () => callback({ success: false, error: "Not authorized" })))
					return;
				if (!isPhase(room, "LOBBY")) {
					return callback({ success: false, error: "Room not in lobby" });
				}

				const incomingId = getYouTubeID(url);
				if (incomingId) {
					const full = await getRoom(code);
					const existing = full.songs.find((s) => getYouTubeID(s.url) === incomingId);
					if (existing) {
						return callback({ success: false, error: "Duplicate song" });
					}
				}

				const song = await addSong(code, {
					url,
					submitter,
					title,
					detailAnswer: detailAnswer ?? undefined,
				});
				const withTitle = { ...song, title };

				log.debug({ code, songId: song.id }, "emitting songAdded");
				// Broadcast just the new song
				io.to(code).emit("songAdded", withTitle);

				callback({ success: true, song: withTitle });
			} catch (err: unknown) {
				log.error({ err, code: data.code }, "addSong handler error");
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
