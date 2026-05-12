import type { Server, Socket } from "socket.io";
import { getRoomGameState } from "@/server/state/gameState";
import type {
	ClientToServerEvents,
	FinalizeResultsPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { setPhase } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { finalizeResultsPayloadSchema, validateWithZod } from "@/server/schemas";

export const finalizeResultsHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("finalizeResults", (data: FinalizeResultsPayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(finalizeResultsPayloadSchema, data, {
			errorMessage: "Invalid finalizeResults payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return cb?.(false);
		if (!requireHost(socket, room, () => cb?.(false))) return;
		if (!isPhase(room, ["RESULTS", "ENDED"])) return cb?.(false);

		const gameState = getRoomGameState(code);
		const canFinalize =
			!!gameState.finalScores &&
			room.songs.length > 0 &&
			gameState.revealedSubmitters.length >= room.songs.length;
		if (!canFinalize) return cb?.(false);

		const updated = setPhase(code, "ENDED");
		if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
