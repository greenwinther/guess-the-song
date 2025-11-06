// src/server/cleanupScheduler.ts
import type { Server } from "socket.io";
import { prisma } from "../lib/prisma";

let started = false;

export function startCleanupScheduler(io: Server, ms = Number(process.env.CLEANUP_INTERVAL_MS ?? 60_000)) {
	if (started) {
		console.warn("cleanupScheduler already started – skipping");
		return;
	}
	started = true;

	setInterval(async () => {
		try {
			// Hämta alla rumkoder i DB
			const rooms = await prisma.room.findMany({ select: { code: true } });

			for (const { code } of rooms) {
				// Finns några sockets i Socket.IO-rummet med samma code?
				const socketsInRoom = io.sockets.adapter.rooms.get(code)?.size ?? 0;

				if (socketsInRoom === 0) {
					// Inga anslutna → radera rummet (Songs/Players följer pga FK-cascade)
					await prisma.room.delete({ where: { code } });
					console.log(`🧹 Cron: deleted empty room ${code}`);
				}
			}
		} catch (e) {
			console.error("Cleanup scheduler error:", e);
		}
	}, ms);
}
