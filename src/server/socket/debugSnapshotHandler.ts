// src/server/socket/debugSnapshotHandler.ts
import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { getRoom } from "../../lib/rooms";
import { toPublicRoom } from "../state/publicRoom";
import { getRoomGameState } from "../state/gameState";
import { exportRoundsState } from "@/lib/game";
import { exportThemeState } from "@/lib/theme";
import { getRoomScores } from "@/lib/score";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.debugSnapshot");

export const debugSnapshotHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("DEV_SNAPSHOT", async (data, cb) => {
		try {
			const code = parseRoomCode(data?.code ?? socket.data.roomMeta?.code ?? "");
			if (!code) return cb?.(false);

			const boundRoom = requireRoom(socket, () => cb?.(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return cb?.(false);
			if (!requireHost(socket, boundRoom, () => cb?.(false))) return;

			const room = await getRoom(code);
			const snapshot = {
				room: toPublicRoom(room),
				gameState: getRoomGameState(code),
				rounds: exportRoundsState()[code] ?? {},
				theme: exportThemeState(),
				scores: getRoomScores(code),
				timestamp: Date.now(),
			};

			log.info({ code, snapshot }, "debug snapshot");
			cb?.(true);
		} catch (err) {
			log.error({ err }, "DEV_SNAPSHOT error");
			cb?.(false);
		}
	});
};
