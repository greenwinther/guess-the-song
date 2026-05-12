import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	JoinAdminRoomPayload,
	JoinAdminRoomResponse,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { getRoom } from "@/server/store/roomStore";
import { bindAdminAccess } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { joinAdminRoomPayloadSchema, validateWithZod } from "@/server/schemas";
import { scopedLogger } from "@/server/logger";

const log = scopedLogger("socket.joinAdminRoom");

export const joinAdminRoomHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on(
		"joinAdminRoom",
		(data: JoinAdminRoomPayload, cb: (res: JoinAdminRoomResponse) => void) => {
			try {
				const payload = validateWithZod(joinAdminRoomPayloadSchema, data, {
					errorMessage: "Invalid joinAdminRoom payload",
				});
				if (!payload.ok) return cb({ ok: false, reason: "error" });
				const { code, adminToken, clientId } = payload.data;

				const room = getRoom(code);
				if (!room) return cb({ ok: false, reason: "not_found" });

				const bound = bindAdminAccess(code, adminToken, clientId);
				if (!bound) return cb({ ok: false, reason: "unauthorized" });

				socket.join(code);
				socket.data.adminMeta = { code, clientId };
				socket.emit("roomData", toPublicRoom(bound));
				cb({ ok: true });
			} catch (err) {
				log.error({ err, code: data?.code }, "joinAdminRoom error");
				cb({ ok: false, reason: "error" });
			}
		}
	);
};
