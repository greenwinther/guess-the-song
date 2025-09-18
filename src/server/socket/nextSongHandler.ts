// src/server/socket/nextSongHandler.ts
import { Server, Socket } from "socket.io";
import { finalizeSongForAll, lockCounts } from "../../lib/game";
import { getRoom } from "../../lib/rooms"; // if you keep currentSong client-side, you may pass it in instead

export const nextSongHandler = (io: Server, socket: Socket) => {
	socket.on(
		"nextSong",
		async (
			data: {
				code: string;
				currentSongId: number; // pass from host client
				nextSongId: number; // pass from host client
			},
			cb?: (ok: boolean) => void
		) => {
			try {
				// Finalize the current song for everyone
				const counts = finalizeSongForAll(data.code, data.currentSongId);

				// Broadcast results for this song if you want (optional), then advance
				io.to(data.code).emit("songFinalized", {
					songId: data.currentSongId,
					counts,
				});

				// Tell clients to switch UI to nextSongId
				io.to(data.code).emit("songChanged", { songId: data.nextSongId });

				cb?.(true);
			} catch (e) {
				console.error("nextSong error", e);
				cb?.(false);
			}
		}
	);
};
