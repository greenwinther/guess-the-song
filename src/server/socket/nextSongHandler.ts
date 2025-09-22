// src/server/socket/nextSongHandler.ts
import { Server, Socket } from "socket.io";
import { finalizeSongForPlayers, getLockedPlayers } from "../../lib/game"; // make sure exported
import { getRoom } from "../../lib/rooms";
import { activeSongByRoom } from "../sharedState";
import { clearRoundLocks, obfuscateTheme, setHint } from "@/lib/theme"; // <-- NEW: theme helpers

export const nextSongHandler = (io: Server, socket: Socket) => {
	socket.on("nextSong", async (data: { code: string }, cb?: (ok: boolean) => void) => {
		try {
			const room = await getRoom(data.code);
			if (!room) return cb?.(false);

			const current = activeSongByRoom[data.code];

			// Finalize hardcore players for the CURRENT song (unchanged)
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

			// 3) THEME side-game integration
			if (nextId !== null) {
				// a) New round → unlock everyone's one guess
				clearRoundLocks(data.code);
				io.to(data.code).emit("THEME_ROUND_RESET");

				// b) If the nextId is the LAST song in the list, send the obfuscated hint now
				const isLastSongNow = nextId === ids[ids.length - 1];
				if (isLastSongNow && room.theme) {
					const obfuscated = obfuscateTheme(room.theme);
					setHint(data.code, obfuscated);
					io.to(data.code).emit("THEME_HINT_READY", { obfuscated });
				}
			}
			// If nextId === null, playlist ended; no new round to unlock.
			// (You could emit THEME_HINT_READY here instead if you prefer it AFTER the list ends.)

			cb?.(true);
		} catch (e) {
			console.error("nextSong error", e);
			cb?.(false);
		}
	});
};
