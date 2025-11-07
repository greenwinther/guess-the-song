// src/server/cleanupScheduler.ts
import type { Server } from "socket.io";
import { prisma } from "../lib/prisma";

let started = false;

export function startCleanupScheduler(io: Server, ms = Number(process.env.CLEANUP_INTERVAL_MS ?? 60_000)) {
	if (started) return console.warn("cleanupScheduler already started"), undefined;
	started = true;

	setInterval(async () => {
		try {
			// ✅ no sockets at all? skip touching the DB.
			if (io.engine.clientsCount === 0) return;

			const rooms = await prisma.room.findMany({ select: { code: true } });
			for (const { code } of rooms) {
				const socketsInRoom = io.sockets.adapter.rooms.get(code)?.size ?? 0;
				if (socketsInRoom === 0) {
					await prisma.room.delete({ where: { code } });
					console.log(`🧹 Cron: deleted empty room ${code}`);
				}
			}
		} catch (e) {
			console.error("Cleanup scheduler error:", e);
		}
	}, ms);
}
