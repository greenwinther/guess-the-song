// // src/server/socket/removeSongHandler.ts
import { removeSong } from "../../lib/rooms";
import { Server, Socket } from "socket.io";

export const removeSongHandler = (io: Server, socket: Socket) => {
	socket.on(
		"removeSong",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				const deletedId = await removeSong(data.code, data.songId);

				// Broadcast to everyone in-room that this song is gone
				io.to(data.code).emit("songRemoved", { songId: deletedId });
				callback({ success: true });
			} catch (err: any) {
				console.error("removeSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);
};
