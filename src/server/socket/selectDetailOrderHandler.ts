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
import { parseIntSafe, parseRoomCode } from "../validation";
import { emitAdminDashboardToHosts } from "./adminDashboard";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.selectDetailOrder");

export const selectDetailOrderHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"selectDetailOrder",
		(data: SelectDetailOrderPayload, cb?: (ok: boolean) => void) => {
			try {
				const code = parseRoomCode(data.code);
				const songId = parseIntSafe(data.songId);
				if (!code || songId == null) return cb?.(false);
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				const playerName = socket.data.roomMeta?.playerName ?? data.playerName;
				storeDetailOrder(code, songId, playerName, data.order);
				void emitAdminDashboardToHosts(io, code);
				cb?.(true);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "selectDetailOrder error");
				cb?.(false);
			}
		}
	);
};
