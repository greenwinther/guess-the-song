// src/server/socket/revealSubmitterHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	RevealSubmitterAllPayload,
	RevealSubmitterPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseIntSafe, parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { addRevealedSong, getRoomGameState } from "../state/gameState";
import { isPhase } from "../logic/phase";
import { getRoom } from "@/lib/rooms";

export const revealSubmitterHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("revealSubmitter", (data: RevealSubmitterPayload) => {
		const code = parseRoomCode(data.code);
		const songId = parseIntSafe(data.songId);
		if (!code || songId == null) return;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["GUESSING", "RECAP", "RESULTS"])) return;

		addRevealedSong(code, songId);
		const list = getRoomGameState(code).revealedSongs;

		io.to(code).emit("submitterRevealed", { songId });
		io.to(code).emit("revealedSongs", list);
	});

	socket.on("revealSubmitterAll", async (data: RevealSubmitterAllPayload) => {
		const code = parseRoomCode(data.code);
		if (!code) return;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["RECAP", "RESULTS"])) return;

		const fullRoom = await getRoom(code);
		if (!fullRoom) return;
		const songIds = fullRoom.songs.map((s) => s.id);
		for (const id of songIds) addRevealedSong(code, id);
		const list = getRoomGameState(code).revealedSongs;

		io.to(code).emit("submitterRevealedAll", { songIds });
		io.to(code).emit("revealedSongs", list);
	});
};
