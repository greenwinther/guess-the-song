import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { setRevealedSongs } from "@/server/state/gameState";
import { isPhase } from "@/server/logic/phase";
import { revealedSongsPayloadSchema, validateWithZod } from "@/server/schemas";

export const revealedSongsHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("revealedSongs", (data: { code: string; revealed: number[] }) => {
		const payload = validateWithZod(revealedSongsPayloadSchema, data, {
			errorMessage: "Invalid revealedSongs payload",
		});
		if (!payload.ok) return;
		const { code, revealed: list } = payload.data;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["GUESSING", "RECAP", "RESULTS"])) return;

		setRevealedSongs(code, list);
		io.to(code).emit("revealedSongs", list);
	});
};
