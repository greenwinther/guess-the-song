// src/server/socket/hardcoreRequiredHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	HardcoreRequiredPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseRoomCode, parseBool } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { setHardcoreRequired } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";

export const hardcoreRequiredHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("HARDCORE_REQUIRED", (data: HardcoreRequiredPayload, cb?: (ok: boolean) => void) => {
		const code = parseRoomCode(data.code);
		if (!code) return cb?.(false);

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room, () => cb?.(false))) return;

		const required = parseBool(data.required, false);
		const updated = setHardcoreRequired(code, required);
		if (!updated) return cb?.(false);

		io.to(code).emit("HARDCORE_REQUIRED_UPDATED", { required });
		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
