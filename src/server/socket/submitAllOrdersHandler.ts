// src/server/socket/submitAllOrdersHandler.ts
import { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";

export const submitAllOrdersHandler = (io: Server, socket: Socket) => {
	socket.on(
		"submitAllOrders",
		async (
			data: {
				code: string;
				playerName: string;
				guesses: Record<string /*songId*/, string[]>;
			},
			callback: (ok: boolean) => void
		) => {
			try {
				for (const [sid, order] of Object.entries(data.guesses)) {
					storeOrder(data.code, parseInt(sid, 10), data.playerName, order);
				}

				// === ADD THIS: broadcast that this player has submitted ===
				io.to(data.code).emit("playerSubmitted", { playerName: data.playerName });

				callback(true);
			} catch (err) {
				console.error("submitAllOrders error", err);
				callback(false);
			}
		}
	);
};
