// src/server/socket/revealedSongsHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { setRevealedSongs } from "../state/gameState";
import { isPhase } from "../logic/phase";

export const revealedSongsHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("revealedSongs", (data: { code: string; revealed: number[] }) => {
		const code = parseRoomCode(data.code);
		if (!code) return;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["GUESSING", "RECAP", "RESULTS"])) return;

		const list = Array.isArray(data.revealed) ? data.revealed.filter((n) => Number.isFinite(n)) : [];
		setRevealedSongs(code, list);
		io.to(code).emit("revealedSongs", list);
	});
};
