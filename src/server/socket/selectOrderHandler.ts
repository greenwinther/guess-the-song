// src/server/socket/selectOrderHandler.ts
import { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";

export const selectOrderHandler = (io: Server, socket: Socket) => {
	socket.on(
		"selectOrder",
		(
			data: {
				code: string;
				songId: number;
				playerName: string;
				order: string[];
			},
			cb?: (ok: boolean) => void
		) => {
			try {
				storeOrder(data.code, data.songId, data.playerName, data.order);
				// Optional: live progress
				io.to(data.code).emit("playerSelectionChanged", {
					playerName: data.playerName,
					songId: data.songId,
				});
				cb?.(true);
			} catch (e) {
				console.error("selectOrder error", e);
				cb?.(false);
			}
		}
	);
};
