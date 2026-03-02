// src/server/cleanupScheduler.ts
import type { Server } from "socket.io";
import { deleteRoom, iterRooms } from "./store/roomStore";
import { clearRoomState } from "./roomStateCleanup";
import { scopedLogger } from "./logger";

let started = false;
const log = scopedLogger("cleanupScheduler");

export function startCleanupScheduler(io: Server, ms = 60_000) {
	if (started) return log.warn("cleanupScheduler already started"), undefined;
	started = true;

	setInterval(async () => {
		try {
			// ✅ no sockets at all? skip touching the DB.
			if (io.engine.clientsCount === 0) return;

			for (const [code] of iterRooms()) {
				const socketsInRoom = io.sockets.adapter.rooms.get(code)?.size ?? 0;
				if (socketsInRoom === 0) {
					deleteRoom(code);
					clearRoomState(code);
					log.info({ code }, "cron deleted empty room");
				}
			}
		} catch (e) {
			log.error({ err: e }, "cleanup scheduler error");
		}
	}, ms);
}
