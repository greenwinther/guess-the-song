// // src/server/socket/removeSongHandler.ts
import { removeSong } from "../../lib/rooms";
import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, RemoveSongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseRoomCode, parseIntSafe } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";

export const removeSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"removeSong",
		async (
			data: RemoveSongPayload,
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				const code = parseRoomCode(data.code);
				const songId = parseIntSafe(data.songId);
				if (!code || songId == null) return callback({ success: false, error: "Invalid input" });

				const room = requireRoom(socket, () => callback({ success: false, error: "No room" }));
				if (!room || room.code !== code) return;
				if (!requireHost(socket, room, () => callback({ success: false, error: "Not host" }))) return;
				if (!isPhase(room, "LOBBY")) {
					return callback({ success: false, error: "Room not in lobby" });
				}

				const deletedId = await removeSong(code, songId);

				// Broadcast to everyone in-room that this song is gone
				io.to(code).emit("songRemoved", { songId: deletedId });
				callback({ success: true });
			} catch (err: unknown) {
				console.error("removeSong error", err);
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
