// src/server/socket/nextSongHandler.ts
import type { Server, Socket } from "socket.io";
import { finalizeDetailForPlayers, finalizeSongForPlayers, getDetailLockedPlayers, getLockedPlayers } from "../../lib/game";
import { getRoom } from "../../lib/rooms";
import { getRoomGameState, setActiveSong } from "../state/gameState";
import { clearRoundLocks, obfuscateTheme, setHint } from "../../lib/theme";
import type { ClientToServerEvents, InterServerEvents, NextSongPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
import { setPhase } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";

export const nextSongHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("nextSong", async (data: NextSongPayload, cb?: (ok: boolean) => void) => {
		try {
			const code = parseRoomCode(data.code);
			if (!code) return cb?.(false);

			const boundRoom = requireRoom(socket, () => cb?.(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return cb?.(false);
			if (!requireHost(socket, boundRoom, () => cb?.(false))) return;

			const room = await getRoom(code);
			if (!room) return cb?.(false);
			if (!isPhase(room, ["GUESSING", "RECAP"])) return cb?.(false);

			const current = getRoomGameState(code).activeSongId;

			// Finalize hardcore players for the CURRENT song (unchanged)
			if (current != null) {
				const hcNames = room.players.filter((p) => p.hardcore).map((p) => p.name);
				const { locked, total } = finalizeSongForPlayers(code, current, hcNames);

				const names = getLockedPlayers(code, current);

				io.to(code).emit("songFinalized", {
					songId: current,
					mode: "hardcoreOnly",
					counts: { locked, total },
					lockedNames: names, // needed for client-side self lock + counts
				});

				const detailLocked = finalizeDetailForPlayers(code, current, hcNames);
				if (detailLocked.total > 0) {
					const detailNames = getDetailLockedPlayers(code, current);
					io.to(code).emit("detailFinalized", {
						songId: current,
						mode: "hardcoreOnly",
						counts: detailLocked,
						lockedNames: detailNames,
					});
				}
			}

			// advance to next song
			const ids = room.songs.map((s) => s.id);
			const idx = current ? ids.indexOf(current) : -1;
			const nextId = ids[idx + 1] ?? null;

			setActiveSong(code, nextId);
			io.to(code).emit("songChanged", { songId: nextId });

			if (nextId === null) {
				const updated = setPhase(code, "RECAP");
				if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
			}

			// 3) THEME side-game integration
			if (nextId !== null) {
				// a) New round → unlock everyone's one guess
				clearRoundLocks(code);
				io.to(code).emit("THEME_ROUND_RESET");

				// b) If the nextId is the LAST song in the list, send the obfuscated hint now
				const isLastSongNow = nextId === ids[ids.length - 1];
				if (isLastSongNow && room.theme) {
					const obfuscated = obfuscateTheme(room.theme);
					setHint(code, obfuscated);
					io.to(code).emit("THEME_HINT_READY", { obfuscated });
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
