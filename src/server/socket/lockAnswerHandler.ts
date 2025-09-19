// src/server/socket/lockAnswerHandler.ts
import { Server, Socket } from "socket.io";
import { manualLock, lockCounts, tryUndoManualLock } from "../../lib/game";
import { activeSongByRoom } from "../sharedState";

export const lockAnswerHandler = (io: Server, socket: Socket) => {
	socket.on(
		"lockAnswer",
		(d: { code: string; songId: number; playerName: string }, cb?: (ok: boolean) => void) => {
			try {
				if (activeSongByRoom[d.code] !== d.songId) return cb?.(false);
				const ok = manualLock(d.code, d.songId, d.playerName); // 👈 only this player
				if (ok) {
					io.to(d.code).emit("playerGuessLocked", {
						songId: d.songId,
						playerName: d.playerName,
						counts: lockCounts(d.code, d.songId),
					});
				}
				cb?.(ok);
			} catch (e) {
				console.error("lockAnswer error", e);
				cb?.(false);
			}
		}
	);

	socket.on(
		"undoLock",
		(data: { code: string; songId: number; playerName: string }, cb?: (ok: boolean) => void) => {
			try {
				const ok = tryUndoManualLock(data.code, data.songId, data.playerName);
				if (ok) {
					const counts = lockCounts(data.code, data.songId);
					io.to(data.code).emit("playerGuessUndo", {
						playerName: data.playerName,
						songId: data.songId,
						counts,
					});
				}
				cb?.(ok);
			} catch (e) {
				console.error("undoLock error", e);
				cb?.(false);
			}
		}
	);
};
