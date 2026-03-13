// src/server/cleanupScheduler.ts
import type { Server } from "socket.io";
import type { RoomState } from "./state/roomState";
import { deleteRoom, iterRooms } from "./store/roomStore";
import { clearRoomState } from "./roomStateCleanup";
import { scopedLogger } from "./logger";

let started = false;
const log = scopedLogger("cleanupScheduler");
export const ROOM_IDLE_TTL_MS = 1000 * 60 * 60 * 24;

export function shouldDeleteRoom(room: RoomState, socketsInRoom: number, now = Date.now()) {
	if (socketsInRoom > 0) return false;
	const lastActiveAt = room.updatedAt ?? room.createdAt ?? 0;
	if (!lastActiveAt) return false;
	return now - lastActiveAt >= ROOM_IDLE_TTL_MS;
}

export function startCleanupScheduler(io: Server, ms = 60_000) {
	if (started) return log.warn("cleanupScheduler already started"), undefined;
	started = true;

	setInterval(async () => {
		try {
			const now = Date.now();
			for (const [code, room] of iterRooms()) {
				const socketsInRoom = io.sockets.adapter.rooms.get(code)?.size ?? 0;
				if (!shouldDeleteRoom(room, socketsInRoom, now)) continue;
				deleteRoom(code);
				clearRoomState(code);
				log.info({ code, lastActiveAt: room.updatedAt ?? room.createdAt }, "cron deleted expired room");
			}
		} catch (e) {
			log.error({ err: e }, "cleanup scheduler error");
		}
	}, ms);
}
