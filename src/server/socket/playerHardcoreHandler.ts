// src/server/socket/playerHardcoreHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	PlayerHardcorePayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireNonHostMember, requireRoom } from "../logic/guards";
import { isPhase } from "../logic/phase";
import { setPlayerHardcore } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";
import { playerHardcorePayloadSchema, validateWithZod } from "../schemas";

export const playerHardcoreHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("PLAYER_HARDCORE", (data: PlayerHardcorePayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(playerHardcorePayloadSchema, data, {
			errorMessage: "Invalid PLAYER_HARDCORE payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code, hardcore } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!isPhase(room, "LOBBY")) return cb?.(false);
		const me = requireNonHostMember(socket, room, () => cb?.(false));
		if (!me) return;

		const updated = setPlayerHardcore(code, me.name, hardcore);
		if (!updated) return cb?.(false);

		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
