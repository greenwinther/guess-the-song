// src/server/socket/selectOrderHandler.ts
import type { Server, Socket } from "socket.io";
import { storeOrder } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	SelectOrderPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";
import { selectOrderPayloadSchema, validateWithZod } from "../schemas";

const log = scopedLogger("socket.selectOrder");

export const selectOrderHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"selectOrder",
		(data: SelectOrderPayload, cb?: (ok: boolean) => void) => {
			try {
				const payload = validateWithZod(selectOrderPayloadSchema, data, {
					errorMessage: "Invalid selectOrder payload",
				});
				if (!payload.ok) return cb?.(false);
				const { code, songId, order, playerName: fallbackPlayerName } = payload.data;

				// accept only for active song
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
				storeOrder(code, songId, playerName, order);
				void emitAdminDashboardToHosts(io, code);
				cb?.(true);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "selectOrder error");
				cb?.(false);
			}
		}
	);
};
