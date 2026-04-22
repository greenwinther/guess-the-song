import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	PlayerReadyPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireNonHostMember, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { setPlayerReady } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { playerReadyPayloadSchema, validateWithZod } from "@/server/schemas";

export const playerReadyHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("PLAYER_READY", (data: PlayerReadyPayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(playerReadyPayloadSchema, data, {
			errorMessage: "Invalid PLAYER_READY payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code, ready } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!isPhase(room, "LOBBY")) return cb?.(false);
		const me = requireNonHostMember(socket, room, () => cb?.(false));
		if (!me) return;

		const updated = setPlayerReady(code, me.name, ready);
		if (!updated) return cb?.(false);

		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
