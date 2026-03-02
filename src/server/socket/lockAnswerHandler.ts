// src/server/socket/lockAnswerHandler.ts
import type { Server, Socket } from "socket.io";
import { manualLock, lockCounts, tryUndoManualLock } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, LockAnswerPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";
import { lockAnswerPayloadSchema, validateWithZod } from "../schemas";

const log = scopedLogger("socket.lockAnswer");

export const lockAnswerHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"lockAnswer",
		(d: LockAnswerPayload, cb?: (ok: boolean) => void) => {
			try {
				const payload = validateWithZod(lockAnswerPayloadSchema, d, {
					errorMessage: "Invalid lockAnswer payload",
				});
				if (!payload.ok) return cb?.(false);
				const { code, songId, playerName: fallbackPlayerName } = payload.data;
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
				const ok = manualLock(code, songId, playerName);
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
				const payload = validateWithZod(lockAnswerPayloadSchema, data, {
					errorMessage: "Invalid undoLock payload",
				});
				if (!payload.ok) return cb?.(false);
				const { code, songId, playerName: fallbackPlayerName } = payload.data;
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
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
