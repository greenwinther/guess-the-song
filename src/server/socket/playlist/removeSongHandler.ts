// // src/server/socket/removeSongHandler.ts
import { removeSong } from "@/lib/rooms";
import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, RemoveSongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { scopedLogger } from "@/server/logger";
import { removeSongPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.removeSong");

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
				const payload = validateWithZod(removeSongPayloadSchema, data, {
					errorMessage: "Invalid removeSong payload",
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
				if (!isPhase(room, "LOBBY")) {
					return callback({ success: false, error: "Room not in lobby" });
				}

				const deletedId = await removeSong(code, songId);

				// Broadcast to everyone in-room that this song is gone
				io.to(code).emit("songRemoved", { songId: deletedId });
				callback({ success: true });
			} catch (err: unknown) {
				log.error({ err, code: data.code, songId: data.songId }, "removeSong error");
				const message = err instanceof Error ? err.message : "Unknown error";
				callback({ success: false, error: message });
			}
		}
	);
};
