// src/server/socket/lockAnswerHandler.ts
import type { Server, Socket } from "socket.io";
import { manualLock, lockCounts, tryUndoManualLock } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, LockAnswerPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { requireNonHostMember, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
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
				const { code, songId } = payload.data;
				const room = requireRoom(socket, () => cb?.(false));
				if (!room || room.code !== code) return cb?.(false);
				if (!isPhase(room, "GUESSING")) return cb?.(false);
				const member = requireNonHostMember(socket, room, () => cb?.(false));
				if (!member) return;
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const ok = manualLock(code, songId, member.name);
				if (ok) {
					io.to(code).emit("playerGuessLocked", {
						songId,
						playerName: member.name,
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
				const { code, songId } = payload.data;
				const room = requireRoom(socket, () => cb?.(false));
				if (!room || room.code !== code) return cb?.(false);
				if (!isPhase(room, "GUESSING")) return cb?.(false);
				const member = requireNonHostMember(socket, room, () => cb?.(false));
				if (!member) return;
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const ok = tryUndoManualLock(code, songId, member.name);
				if (ok) {
					const counts = lockCounts(code, songId);
					io.to(code).emit("playerGuessUndo", {
						playerName: member.name,
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
