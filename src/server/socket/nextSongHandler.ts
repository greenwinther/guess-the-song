// src/server/socket/nextSongHandler.ts
import { Server, Socket } from "socket.io";
import { finalizeSongForPlayers, getLockedPlayers } from "../../lib/game"; // make sure exported
import { getRoom } from "../../lib/rooms";
import { activeSongByRoom } from "../sharedState";

export const nextSongHandler = (io: Server, socket: Socket) => {
	socket.on("nextSong", async (data: { code: string }, cb?: (ok: boolean) => void) => {
		try {
			const room = await getRoom(data.code);
			if (!room) return cb?.(false);

			const current = activeSongByRoom[data.code];
			if (current != null) {
				const hcNames = room.players.filter((p) => p.hardcore).map((p) => p.name);
				const { locked, total } = finalizeSongForPlayers(data.code, current, hcNames);

				const names = getLockedPlayers(data.code, current);

				io.to(data.code).emit("songFinalized", {
					songId: current,
					mode: "hardcoreOnly",
					counts: { locked, total },
					lockedNames: names, // needed for client-side self lock + counts
				});
			}

			// advance to next song
			const ids = room.songs.map((s) => s.id);
			const idx = current ? ids.indexOf(current) : -1;
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
