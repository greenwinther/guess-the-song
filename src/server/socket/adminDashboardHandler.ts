import type { Server, Socket } from "socket.io";
import type {
	AdminGetDashboardPayload,
	AdminGetDashboardResponse,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireMember, requireRoom } from "../logic/guards";
import { buildAdminDashboard } from "./adminDashboard";

export const adminDashboardHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"ADMIN_GET_DASHBOARD",
		(data: AdminGetDashboardPayload, cb: (res: AdminGetDashboardResponse) => void) => {
			const code = parseRoomCode(data?.code);
			if (!code) return cb({ ok: false, error: "BAD_REQUEST" });

			const room = requireRoom(socket, () => cb({ ok: false, error: "NOT_AUTHORIZED" }));
			if (!room || room.code !== code) return cb({ ok: false, error: "NOT_AUTHORIZED" });
			const member = requireMember(socket, room, () => cb({ ok: false, error: "NOT_AUTHORIZED" }));
			if (!member) return;
			if (!member.isHost && room.phase !== "RESULTS") {
				cb({ ok: false, error: "NOT_AUTHORIZED" });
				return;
			}

			const dashboard = buildAdminDashboard(code);
			if (!dashboard) return cb({ ok: false, error: "ROOM_NOT_FOUND" });
			cb({ ok: true, dashboard });
		}
	);
};
