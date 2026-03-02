// src/server/socket/playerReadyHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	PlayerReadyPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseBool, parseRoomCode } from "../validation";
import { requireMember, requireRoom } from "../logic/guards";
import { setPlayerReady } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";

export const playerReadyHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("PLAYER_READY", (data: PlayerReadyPayload, cb?: (ok: boolean) => void) => {
		const code = parseRoomCode(data.code);
		if (!code) return cb?.(false);

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		const me = requireMember(socket, room, () => cb?.(false));
		if (!me) return;

		const ready = parseBool(data.ready, false);
		const updated = setPlayerReady(code, me.name, ready);
		if (!updated) return cb?.(false);

		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
