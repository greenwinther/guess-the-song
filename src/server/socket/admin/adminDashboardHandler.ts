import type { Server, Socket } from "socket.io";
import type {
	AdminGetDashboardPayload,
	AdminGetDashboardResponse,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHostOrAdmin, requireMember, requireRoom } from "@/server/logic/guards";
import { buildAdminDashboard } from "@/server/socket/admin/adminDashboard";
import { adminGetDashboardPayloadSchema, validateWithZod } from "@/server/schemas";
import { getRoomGameState } from "@/server/state/gameState";

export const adminDashboardHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"ADMIN_GET_DASHBOARD",
		(data: AdminGetDashboardPayload, cb: (res: AdminGetDashboardResponse) => void) => {
			const payload = validateWithZod(adminGetDashboardPayloadSchema, data, {
				errorMessage: "Invalid ADMIN_GET_DASHBOARD payload",
			});
			if (!payload.ok) return cb({ ok: false, error: "BAD_REQUEST" });
			const { code } = payload.data;

			const room = requireRoom(socket, () => cb({ ok: false, error: "NOT_AUTHORIZED" }));
			if (!room || room.code !== code) return cb({ ok: false, error: "NOT_AUTHORIZED" });
			const auth = requireHostOrAdmin(socket, room);
			if (!auth) {
				const member = requireMember(socket, room);
				const gameState = getRoomGameState(code);
				const allSubmittersRevealed =
					room.songs.length > 0 && gameState.revealedSubmitters.length >= room.songs.length;
				const canPlayerExport =
					!!member &&
					!member.isHost &&
					room.phase === "ENDED" &&
					!!gameState.finalScores &&
					allSubmittersRevealed;
				if (!canPlayerExport) return cb({ ok: false, error: "NOT_AUTHORIZED" });
			}

			const dashboard = buildAdminDashboard(code);
			if (!dashboard) return cb({ ok: false, error: "ROOM_NOT_FOUND" });
			cb({ ok: true, dashboard });
		}
	);
};
