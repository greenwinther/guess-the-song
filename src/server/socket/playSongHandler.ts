// src/server/socket/playSongHandler.ts
import { Server, Socket } from "socket.io";
import { revealedSongsByRoom } from "./sharedState";
import { prisma } from "../../lib/prisma";

export const playSongHandler = (io: Server, socket: Socket) => {
	socket.on(
		"playSong",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				// 1) Look up the clip
				const song = await prisma.song.findUnique({ where: { id: data.songId } });
				if (!song) {
					return callback({ success: false, error: "Song not found." });
				}

				// 2) Broadcast the song to everyone in the room
				io.to(data.code).emit("playSong", {
					songId: song.id,
					clipUrl: song.url,
				});

				// 3) Update revealed songs in memory
				if (!revealedSongsByRoom[data.code]) {
					revealedSongsByRoom[data.code] = [];
				}
				if (!revealedSongsByRoom[data.code].includes(data.songId)) {
					revealedSongsByRoom[data.code].push(data.songId);
				}

				// ✅ 4) Emit updated revealedSongs to sync with all clients
				io.to(data.code).emit("revealedSongs", revealedSongsByRoom[data.code]);

				callback({ success: true });
			} catch (err: any) {
				console.error("playSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);
};
