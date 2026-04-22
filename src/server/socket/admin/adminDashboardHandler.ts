import type { Server, Socket } from "socket.io";
import type {
	AdminGetDashboardPayload,
	AdminGetDashboardResponse,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { buildAdminDashboard } from "@/server/socket/admin/adminDashboard";
import { adminGetDashboardPayloadSchema, validateWithZod } from "@/server/schemas";

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
			if (!requireHost(socket, room, () => cb({ ok: false, error: "NOT_AUTHORIZED" }))) return;

			const dashboard = buildAdminDashboard(code);
			if (!dashboard) return cb({ ok: false, error: "ROOM_NOT_FOUND" });
			cb({ ok: true, dashboard });
		}
	);
};
