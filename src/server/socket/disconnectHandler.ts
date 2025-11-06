// src/server/socket/disconnectHandler.ts
import { Server, Socket } from "socket.io";
import { getRoom } from "../../lib/rooms";
import { prisma } from "../../lib/prisma";

export const disconnectHandler = (io: Server, socket: Socket) => {
	socket.on("disconnect", async (reason) => {
		console.log("↔️ socket disconnected", socket.id, reason);

		const meta = socket.data.roomMeta as { code: string; playerName: string } | undefined;
		if (!meta) return;

		const { code, playerName } = meta;

		try {
			const before = await getRoom(code);
			const leftPlayer = before.players.find((p) => p.name === playerName);
			if (!leftPlayer) return;

			console.log(`🚨 Player "${leftPlayer.name}" (id: ${leftPlayer.id}) left room ${code}`);

			await prisma.player.delete({ where: { id: leftPlayer.id } });

			const socketsInRoom = io.sockets.adapter.rooms.get(code)?.size ?? 0;
			if (socketsInRoom === 0) {
				// Inga aktiva connections i rummet -> ta bort hela rummet
				try {
					await prisma.room.delete({ where: { code } });
					console.log(`🧹 Deleted empty room ${code}`);
				} catch (e) {
					console.error("Failed deleting empty room", e);
				}
			} else {
				// fortfarande folk kvar → skicka färsk snapshot
				const after = await getRoom(code);
				io.to(code).emit("roomData", after);
			}

			// notify first, then send fresh snapshot
			io.to(code).emit("playerLeft", leftPlayer.id);

			const after = await getRoom(code);
			io.to(code).emit("roomData", after);
		} catch (err) {
			console.error("[disconnect] cleanup error", err);
		}
	});
};
