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
import { parseRoomCode, parseIntSafe } from "../validation";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.selectOrder");

export const selectOrderHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"selectOrder",
		(data: SelectOrderPayload, cb?: (ok: boolean) => void) => {
			try {
				const code = parseRoomCode(data.code);
				const songId = parseIntSafe(data.songId);
				if (!code || songId == null) return cb?.(false);

				// accept only for active song
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? data.playerName;
				storeOrder(code, songId, playerName, data.order);
				void emitAdminDashboardToHosts(io, code);
				cb?.(true);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "selectOrder error");
				cb?.(false);
			}
		}
	);
};
