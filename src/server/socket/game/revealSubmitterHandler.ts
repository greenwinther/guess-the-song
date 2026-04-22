import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	RevealSubmitterAllPayload,
	RevealSubmitterPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { addRevealedSong, getRoomGameState } from "@/server/state/gameState";
import { isPhase } from "@/server/logic/phase";
import { getRoom } from "@/lib/rooms";
import {
	revealSubmitterAllPayloadSchema,
	revealSubmitterPayloadSchema,
	validateWithZod,
} from "@/server/schemas";

export const revealSubmitterHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("revealSubmitter", (data: RevealSubmitterPayload) => {
		const payload = validateWithZod(revealSubmitterPayloadSchema, data, {
			errorMessage: "Invalid revealSubmitter payload",
		});
		if (!payload.ok) return;
		const { code, songId } = payload.data;

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
		const payload = validateWithZod(revealSubmitterAllPayloadSchema, data, {
			errorMessage: "Invalid revealSubmitterAll payload",
		});
		if (!payload.ok) return;
		const { code } = payload.data;

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
