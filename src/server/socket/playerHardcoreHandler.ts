// src/server/socket/playerHardcoreHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	PlayerHardcorePayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseBool, parseRoomCode } from "../validation";
import { requireMember, requireRoom } from "../logic/guards";
import { setPlayerHardcore } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";

export const playerHardcoreHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("PLAYER_HARDCORE", (data: PlayerHardcorePayload, cb?: (ok: boolean) => void) => {
		const code = parseRoomCode(data.code);
		if (!code) return cb?.(false);

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		const me = requireMember(socket, room, () => cb?.(false));
		if (!me) return;

		const hardcore = parseBool(data.hardcore, false);
		const updated = setPlayerHardcore(code, me.name, hardcore);
		if (!updated) return cb?.(false);

		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
