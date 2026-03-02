// src/server/socket/addSongHandler.ts
import type { Submission } from "../../types/submission";
import type { Server, Socket } from "socket.io";
import { addSong, getRoom } from "../../lib/rooms";
import type { AddSongPayload, ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseName, parseRequiredUrl, parseRoomCode, parseOptionalText } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
import { getYouTubeID } from "@/lib/youtube";

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
				const code = parseRoomCode(data.code);
				if (!code) return callback({ success: false, error: "Invalid room code" });
				const url = parseRequiredUrl(data.url);
				if (!url) return callback({ success: false, error: "Invalid URL" });
				const submitter = parseName(data.submitter, "Player");
				const title = parseOptionalText(data.title) ?? "";
				const detailAnswer = parseOptionalText((data as { detailAnswer?: string }).detailAnswer);

				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHost(socket, room, () => callback({ success: false, error: "Not host" }))) return;
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

				console.log("[server] emitting songAdded:", song);
				// Broadcast just the new song
				io.to(code).emit("songAdded", withTitle);

				callback({ success: true, song: withTitle });
			} catch (err: unknown) {
				console.error("[server] addSong error", err);
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
