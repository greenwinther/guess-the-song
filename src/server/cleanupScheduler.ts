// src/server/cleanupScheduler.ts
import type { Server } from "socket.io";
import { deleteRoom, iterRooms } from "./store/roomStore";
import { clearRoomState } from "./roomStateCleanup";

let started = false;

export function startCleanupScheduler(io: Server, ms = Number(process.env.CLEANUP_INTERVAL_MS ?? 60_000)) {
	if (started) return console.warn("cleanupScheduler already started"), undefined;
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
					console.log(`🧹 Cron: deleted empty room ${code}`);
				}
			}
		} catch (e) {
			console.error("Cleanup scheduler error:", e);
		}
	}, ms);
}
