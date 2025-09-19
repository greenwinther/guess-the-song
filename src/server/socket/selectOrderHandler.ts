// src/server/socket/selectOrderHandler.ts
import { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";
import { activeSongByRoom } from "../sharedState";

export const selectOrderHandler = (io: Server, socket: Socket) => {
	socket.on(
		"selectOrder",
		(
			data: { code: string; songId: number; playerName: string; order: string[] },
			cb?: (ok: boolean) => void
		) => {
			try {
				// accept only for active song
				if (activeSongByRoom[data.code] !== data.songId) return cb?.(false);
				storeOrder(data.code, data.songId, data.playerName, data.order);
				cb?.(true);
			} catch (e) {
				console.error("selectOrder error", e);
				cb?.(false);
			}
		}
	);
};
