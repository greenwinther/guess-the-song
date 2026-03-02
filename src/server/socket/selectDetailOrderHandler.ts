// src/server/socket/selectDetailOrderHandler.ts
import type { Server, Socket } from "socket.io";
import { storeDetailOrder } from "../../lib/game";
import { getRoomGameState } from "../state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	SelectDetailOrderPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";
import { selectDetailOrderPayloadSchema, validateWithZod } from "../schemas";

const log = scopedLogger("socket.selectDetailOrder");

export const selectDetailOrderHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"selectDetailOrder",
		(data: SelectDetailOrderPayload, cb?: (ok: boolean) => void) => {
			try {
				const payload = validateWithZod(selectDetailOrderPayloadSchema, data, {
					errorMessage: "Invalid selectDetailOrder payload",
				});
				if (!payload.ok) return cb?.(false);
				const { code, songId, order, playerName: fallbackPlayerName } = payload.data;

				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? fallbackPlayerName;
				storeDetailOrder(code, songId, playerName, order);
				void emitAdminDashboardToHosts(io, code);
				cb?.(true);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "selectDetailOrder error");
				cb?.(false);
			}
		}
	);
};
