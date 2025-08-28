// src/server/socket/disconnectHandler.ts
import { Server, Socket } from "socket.io";
import { getRoom } from "../../lib/rooms";
import { prisma } from "../../lib/prisma";

export const disconnectHandler = (io: Server, socket: Socket) => {
	socket.on("disconnect", async (reason) => {
		console.log("↔️ socket disconnected", socket.id);
		console.log(`↔️ socket ${socket.id} disconnected:`, reason);

		const meta = socket.data.roomMeta as { code: string; playerName: string } | undefined;
		if (meta) {
			const { code, playerName } = meta;

			try {
				const updated = await getRoom(code);
				if (!updated) return;

				// Find the player before removing them
				const leftPlayer = updated.players.find((p) => p.name === playerName);
				if (!leftPlayer) return;

				console.log(`🚨 Player "${leftPlayer.name}" (id: ${leftPlayer.id}) left room ${code}`);

				// Remove from room
				await prisma.player.delete({
					where: { id: leftPlayer.id },
				});

				// Notify other clients
				io.to(code).emit("playerLeft", leftPlayer.id);
				io.to(code).emit("roomData", updated);
			} catch (err) {
				console.error("[disconnect] cleanup error", err);
			}
		}
	});
};
