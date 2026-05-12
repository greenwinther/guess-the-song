import type { Server, Socket } from "socket.io";
import { storeOrder } from "@/lib/game";
import { getRoomGameState, isSubmitterRevealed } from "@/server/state/gameState";
import type {
	ClientToServerEvents,
	InterServerEvents,
	SelectOrderPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireNonHostMember, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { emitAdminDashboardToHosts } from "@/server/socket/admin/adminDashboard";
import { scopedLogger } from "@/server/logger";
import { selectOrderPayloadSchema, validateWithZod } from "@/server/schemas";

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
				const { code, songId, order } = payload.data;

				const room = requireRoom(socket, () => cb?.(false));
				if (!room || room.code !== code) return cb?.(false);
				if (!isPhase(room, ["GUESSING", "RECAP"])) return cb?.(false);
				const member = requireNonHostMember(socket, room, () => cb?.(false));
				if (!member) return;
				if (isSubmitterRevealed(code, songId)) return cb?.(false);

				// accept only for active song
				if (getRoomGameState(code).activeSongId !== songId) return cb?.(false);
				storeOrder(code, songId, member.name, order);
				void emitAdminDashboardToHosts(io, code);
				cb?.(true);
			} catch (e) {
				log.error({ err: e, code: data.code, songId: data.songId }, "selectOrder error");
				cb?.(false);
			}
		}
	);
};
