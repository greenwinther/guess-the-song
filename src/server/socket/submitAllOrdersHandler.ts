// src/server/socket/submitAllOrdersHandler.ts
import type { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, SubmitAllOrdersPayload } from "@/types/socket";
import { requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
import { scopedLogger } from "../logger";
import { submitAllOrdersPayloadSchema, validateWithZod } from "../schemas";

const log = scopedLogger("socket.submitAllOrders");

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
				const payload = validateWithZod(submitAllOrdersPayloadSchema, data, {
					errorMessage: "Invalid submitAllOrders payload",
				});
				if (!payload.ok) return callback(false);
				const { code, guesses, playerName: fallbackPlayerName } = payload.data;

				const room = requireRoom(socket, () => callback(false));
				if (!room || room.code !== code) return;
				if (!isPhase(room, ["GUESSING", "RECAP"])) return callback(false);

				const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
				for (const [sid, order] of Object.entries(guesses)) {
					storeOrder(code, parseInt(sid, 10), playerName, order);
				}

				// === ADD THIS: broadcast that this player has submitted ===
				io.to(code).emit("playerSubmitted", { playerName });

				callback(true);
			} catch (err) {
				log.error({ err, code: data.code, playerName: data.playerName }, "submitAllOrders error");
				callback(false);
			}
		}
	);
};
