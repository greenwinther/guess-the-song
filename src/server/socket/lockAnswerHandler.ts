// src/server/socket/lockAnswerHandler.ts
import { Server, Socket } from "socket.io";
import { manualLock, tryUndoManualLock, lockCounts } from "../../lib/game";

export const lockAnswerHandler = (io: Server, socket: Socket) => {
	socket.on(
		"lockAnswer",
		(data: { code: string; songId: number; playerName: string }, cb?: (ok: boolean) => void) => {
			try {
				const ok = manualLock(data.code, data.songId, data.playerName);
				if (ok) {
					const counts = lockCounts(data.code, data.songId);
					io.to(data.code).emit("playerGuessLocked", {
						playerName: data.playerName,
						songId: data.songId,
						counts,
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
