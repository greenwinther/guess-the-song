// src/server/socket/submitAllOrdersHandler.ts
import type { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, SubmitAllOrdersPayload } from "@/types/socket";
import { requireNonHostMember, requireRoom } from "../logic/guards";
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
				const { code, guesses } = payload.data;

				const room = requireRoom(socket, () => callback(false));
				if (!room || room.code !== code) return;
				if (!isPhase(room, "GUESSING")) return callback(false);
				const member = requireNonHostMember(socket, room, () => callback(false));
				if (!member) return;

				for (const [sid, order] of Object.entries(guesses)) {
					storeOrder(code, parseInt(sid, 10), member.name, order);
				}

				// === ADD THIS: broadcast that this player has submitted ===
				io.to(code).emit("playerSubmitted", { playerName: member.name });

				callback(true);
			} catch (err) {
				log.error({ err, code: data.code, playerName: data.playerName }, "submitAllOrders error");
				callback(false);
			}
		}
	);
};
