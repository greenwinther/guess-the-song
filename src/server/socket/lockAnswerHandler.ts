// src/server/socket/lockAnswerHandler.ts
import type { Server, Socket } from "socket.io";
import { manualLock, lockCounts, tryUndoManualLock } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, LockAnswerPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseRoomCode, parseIntSafe } from "../validation";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.lockAnswer");

export const lockAnswerHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"lockAnswer",
		(d: LockAnswerPayload, cb?: (ok: boolean) => void) => {
			try {
				const code = parseRoomCode(d.code);
				const songId = parseIntSafe(d.songId);
				if (!code || songId == null) return cb?.(false);
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? d.playerName;
				const ok = manualLock(code, songId, playerName); // 👈 only this player
				if (ok) {
					io.to(code).emit("playerGuessLocked", {
						songId,
						playerName,
						counts: lockCounts(code, songId),
					});
					void emitAdminDashboardToHosts(io, code);
				}
				cb?.(ok);
			} catch (e) {
				log.error({ err: e, code: d.code, songId: d.songId }, "lockAnswer error");
				cb?.(false);
			}
		}
	);

	socket.on(
		"undoLock",
		(data: LockAnswerPayload, cb?: (ok: boolean) => void) => {
			try {
				const code = parseRoomCode(data.code);
				const songId = parseIntSafe(data.songId);
				if (!code || songId == null) return cb?.(false);
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? data.playerName;
				const ok = tryUndoManualLock(code, songId, playerName);
				if (ok) {
					const counts = lockCounts(code, songId);
					io.to(code).emit("playerGuessUndo", {
						playerName,
						songId,
						counts,
					});
					void emitAdminDashboardToHosts(io, code);
				}
				cb?.(ok);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "undoLock error");
				cb?.(false);
			}
		}
	);
};
