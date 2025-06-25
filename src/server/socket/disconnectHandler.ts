// src/server/socket/disconnectHandler.ts
import { Server, Socket } from "socket.io";
import { getRoom } from "@/lib/rooms";

export const disconnectHandler = (io: Server, socket: Socket) => {
	socket.on("disconnect", async (reason) => {
		console.log("↔️ socket disconnected", socket.id);
		console.log(`↔️ socket ${socket.id} disconnected:`, reason);

		// If we had stored room+playerName in socket.data, remove them now:
		const meta = socket.data.roomMeta as { code: string; playerName: string } | undefined;
		if (meta) {
			const { code, playerName } = meta;

			try {
				const updated = await getRoom(code);
				io.to(code).emit("roomData", updated);
			} catch (err) {
				console.error("[disconnect] cleanup error", err);
			}
		}
	});
};
