// src/server/socket/lockDetailAnswerHandler.ts
import type { Server, Socket } from "socket.io";
import { getDetailLockedPlayers, manualDetailLock, tryUndoDetailLock } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	LockDetailPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";
import { lockDetailPayloadSchema, validateWithZod } from "../schemas";

const log = scopedLogger("socket.lockDetailAnswer");

export const lockDetailAnswerHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("lockDetailAnswer", (d: LockDetailPayload, cb?: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(lockDetailPayloadSchema, d, {
				errorMessage: "Invalid lockDetailAnswer payload",
			});
			if (!payload.ok) return cb?.(false);
			const { code, songId, playerName: fallbackPlayerName } = payload.data;
			if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
			const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
			const ok = manualDetailLock(code, songId, playerName);
			if (ok) {
				const locked = getDetailLockedPlayers(code, songId);
				io.to(code).emit("detailLockSnapshot", { songId, locked });
				void emitAdminDashboardToHosts(io, code);
			}
			cb?.(ok);
		} catch (e) {
			log.error({ err: e, code: d.code, songId: d.songId }, "lockDetailAnswer error");
			cb?.(false);
		}
	});

	socket.on("undoDetailLock", (d: LockDetailPayload, cb?: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(lockDetailPayloadSchema, d, {
				errorMessage: "Invalid undoDetailLock payload",
			});
			if (!payload.ok) return cb?.(false);
			const { code, songId, playerName: fallbackPlayerName } = payload.data;
			if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
			const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
			const ok = tryUndoDetailLock(code, songId, playerName);
			if (ok) {
				const locked = getDetailLockedPlayers(code, songId);
				io.to(code).emit("detailLockSnapshot", { songId, locked });
				void emitAdminDashboardToHosts(io, code);
			}
			cb?.(ok);
		} catch (e) {
			log.error({ err: e, code: d.code, songId: d.songId }, "undoDetailLock error");
			cb?.(false);
		}
	});
};
