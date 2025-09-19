// src/server/socket/nextSongHandler.ts
import { Server, Socket } from "socket.io";
import { finalizeSongForPlayers } from "../../lib/game";
import { getRoom, getHardcorePlayerNames } from "../../lib/rooms";
import { activeSongByRoom } from "../sharedState"; // adjust path if needed

export const nextSongHandler = (io: Server, socket: Socket) => {
	socket.on("nextSong", async (data: { code: string }, cb?: (ok: boolean) => void) => {
		try {
			const room = await getRoom(data.code);
			if (!room) return cb?.(false);

			const current = activeSongByRoom[data.code];

			if (current != null) {
				const hcNames = await getHardcorePlayerNames(data.code);
				// 🔒 lock ONLY hardcore players
				const { locked, total } = finalizeSongForPlayers(data.code, current, hcNames);
				io.to(data.code).emit("songFinalized", {
					songId: current,
					locked,
					total,
					mode: "hardcoreOnly",
				});
			}

			// advance
			const ids = room.songs.map((s) => s.id);
			const idx = current != null ? ids.indexOf(current) : -1;
			const nextId = ids[idx + 1] ?? null;

			activeSongByRoom[data.code] = nextId;
			io.to(data.code).emit("songChanged", { songId: nextId });

			cb?.(true);
		} catch (e) {
			console.error("nextSong error", e);
			cb?.(false);
		}
	});
};
