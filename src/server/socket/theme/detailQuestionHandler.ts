import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	DetailQuestionPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { setDetailQuestion, getRoom } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import { isPhase } from "@/server/logic/phase";
import { detailQuestionPayloadSchema, validateWithZod } from "@/server/schemas";

export const detailQuestionHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("DETAIL_QUESTION", (data: DetailQuestionPayload) => {
		const payload = validateWithZod(detailQuestionPayloadSchema, data, {
			errorMessage: "Invalid DETAIL_QUESTION payload",
		});
		if (!payload.ok) return;
		const { code, question } = payload.data;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHostOrAdmin(socket, room)) return;
		if (!isPhase(room, "LOBBY")) return;

		setDetailQuestion(code, question);
		const updated = getRoom(code);
		if (!updated) return;
		io.to(code).emit("roomData", toPublicRoom(updated));
	});
};
