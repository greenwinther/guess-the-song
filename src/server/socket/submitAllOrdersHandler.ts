// src/server/socket/submitAllOrdersHandler.ts
import type { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, SubmitAllOrdersPayload } from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";

export const submitAllOrdersHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"submitAllOrders",
		async (
			data: SubmitAllOrdersPayload,
			callback: (ok: boolean) => void
		) => {
			try {
				const code = parseRoomCode(data.code);
				if (!code) return callback(false);

				const room = requireRoom(socket, () => callback(false));
				if (!room || room.code !== code) return;
				if (!isPhase(room, ["GUESSING", "RECAP"])) return callback(false);

				const playerName = socket.data.roomMeta?.playerName ?? data.playerName;
				for (const [sid, order] of Object.entries(data.guesses)) {
					storeOrder(code, parseInt(sid, 10), playerName, order);
				}

				// === ADD THIS: broadcast that this player has submitted ===
				io.to(code).emit("playerSubmitted", { playerName });

				callback(true);
			} catch (err) {
				console.error("submitAllOrders error", err);
				callback(false);
			}
		}
	);
};
