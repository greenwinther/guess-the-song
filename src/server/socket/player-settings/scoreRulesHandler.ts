import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	ScoreRulesPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { scoreRulesPayloadSchema, validateWithZod } from "@/server/schemas";
import { toPublicRoom } from "@/server/state/publicRoom";
import { setScoringRules } from "@/server/store/roomStore";

export const scoreRulesHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("SCORE_RULES", (data: ScoreRulesPayload, cb?: (ok: boolean) => void) => {
		const payload = validateWithZod(scoreRulesPayloadSchema, data, {
			errorMessage: "Invalid SCORE_RULES payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code, ...scoring } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return cb?.(false);
		if (!requireHostOrAdmin(socket, room, () => cb?.(false))) return;
		if (!isPhase(room, "LOBBY")) return cb?.(false);

		const updated = setScoringRules(code, scoring);
		if (!updated) return cb?.(false);

		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
