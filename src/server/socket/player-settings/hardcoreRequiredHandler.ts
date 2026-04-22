import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	HardcoreRequiredPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { setHardcoreRequired } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { hardcoreRequiredPayloadSchema, validateWithZod } from "@/server/schemas";

export const hardcoreRequiredHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("HARDCORE_REQUIRED", (data: HardcoreRequiredPayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(hardcoreRequiredPayloadSchema, data, {
			errorMessage: "Invalid HARDCORE_REQUIRED payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code, required } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room, () => cb?.(false))) return;
		if (!isPhase(room, "LOBBY")) return cb?.(false);

		const updated = setHardcoreRequired(code, required);
		if (!updated) return cb?.(false);

		io.to(code).emit("HARDCORE_REQUIRED_UPDATED", { required });
		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
