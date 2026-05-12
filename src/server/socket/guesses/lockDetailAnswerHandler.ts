import type { Server, Socket } from "socket.io";
import { getDetailLockedPlayers, manualDetailLock, tryUndoDetailLock } from "@/lib/game";
import { getRoomGameState, isSubmitterRevealed } from "@/server/state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	LockDetailPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireNonHostMember, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { emitAdminDashboardToHosts } from "@/server/socket/admin/adminDashboard";
import { scopedLogger } from "@/server/logger";
import { lockDetailPayloadSchema, validateWithZod } from "@/server/schemas";

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
			const { code, songId } = payload.data;
			const room = requireRoom(socket, () => cb?.(false));
			if (!room || room.code !== code) return cb?.(false);
			if (!isPhase(room, ["GUESSING", "RECAP"])) return cb?.(false);
			const member = requireNonHostMember(socket, room, () => cb?.(false));
			if (!member) return;
			if (isSubmitterRevealed(code, songId)) return cb?.(false);
			if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
			const ok = manualDetailLock(code, songId, member.name, {
				multiplierEligible: isPhase(room, "GUESSING"),
			});
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
			const { code, songId } = payload.data;
			const room = requireRoom(socket, () => cb?.(false));
			if (!room || room.code !== code) return cb?.(false);
			if (!isPhase(room, ["GUESSING", "RECAP"])) return cb?.(false);
			const member = requireNonHostMember(socket, room, () => cb?.(false));
			if (!member) return;
			if (isSubmitterRevealed(code, songId)) return cb?.(false);
			if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
			const ok = tryUndoDetailLock(code, songId, member.name);
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
