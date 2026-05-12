import type { Server, Socket } from "socket.io";
import type {
	BeginRecapPayload,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { setPhase } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { beginRecapPayloadSchema, validateWithZod } from "@/server/schemas";

export const beginRecapHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("beginRecap", (data: BeginRecapPayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(beginRecapPayloadSchema, data, {
			errorMessage: "Invalid beginRecap payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return cb?.(false);
		if (!requireHost(socket, room, () => cb?.(false))) return;
		if (!isPhase(room, ["GUESSING", "RECAP"])) return cb?.(false);

		const updated = setPhase(code, "RECAP");
		if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
