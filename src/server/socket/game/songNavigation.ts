import type { Server } from "socket.io";
import {
	finalizeDetailForPlayers,
	finalizeSongForPlayers,
	getDetailLockedPlayers,
	getLockedPlayers,
} from "@/lib/game";
import { addRevealedSong, getRoomGameState, setActiveSong } from "@/server/state/gameState";
import { isPhase } from "@/server/logic/phase";
import type { RoomState } from "@/server/state/roomState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";

const SONG_CHANGE_GUARD_MS = 550;
const lastSongChangeByCode = new Map<string, number>();

type ChangeCurrentSongResult = {
	ok: boolean;
	previousSongId: number | null;
	nextSongId: number | null;
	reason?: "THROTTLED" | "NO_CHANGE";
};

export function changeCurrentSong(
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	room: RoomState,
	currentSongId: number | null,
	nextSongId: number | null
): ChangeCurrentSongResult {
	if (currentSongId === nextSongId) {
		return { ok: false, previousSongId: currentSongId, nextSongId: currentSongId, reason: "NO_CHANGE" };
	}

	const now = Date.now();
	const lastChangeAt = lastSongChangeByCode.get(room.code) ?? 0;
	if (now - lastChangeAt < SONG_CHANGE_GUARD_MS) {
		return { ok: false, previousSongId: currentSongId, nextSongId: currentSongId, reason: "THROTTLED" };
	}

	// Gameplay rule: when leaving an active song during GUESSING, auto-lock hardcore players.
	if (currentSongId != null && isPhase(room, "GUESSING")) {
		const hardcoreNames = room.players.filter((player) => player.hardcore).map((player) => player.name);
		const submitterLocks = finalizeSongForPlayers(room.code, currentSongId, hardcoreNames, {
			multiplierEligible: true,
		});
		const submitterLockedNames = getLockedPlayers(room.code, currentSongId);
		io.to(room.code).emit("songFinalized", {
			songId: currentSongId,
			mode: "hardcoreOnly",
			counts: submitterLocks,
			lockedNames: submitterLockedNames,
		});

		const detailLocks = finalizeDetailForPlayers(room.code, currentSongId, hardcoreNames, {
			multiplierEligible: true,
		});
		if (detailLocks.total > 0) {
			const detailLockedNames = getDetailLockedPlayers(room.code, currentSongId);
			io.to(room.code).emit("detailFinalized", {
				songId: currentSongId,
				mode: "hardcoreOnly",
				counts: detailLocks,
				lockedNames: detailLockedNames,
			});
		}
	}

	setActiveSong(room.code, nextSongId);
	lastSongChangeByCode.set(room.code, now);

	if (nextSongId != null && isPhase(room, "GUESSING")) {
		addRevealedSong(room.code, nextSongId);
		io.to(room.code).emit("revealedSongs", getRoomGameState(room.code).revealedSongs);
	}

	io.to(room.code).emit("songChanged", { songId: nextSongId });
	return { ok: true, previousSongId: currentSongId, nextSongId };
}
