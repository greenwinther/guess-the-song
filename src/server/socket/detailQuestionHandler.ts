// src/server/socket/detailQuestionHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	DetailQuestionPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { setDetailQuestion, getRoom } from "@/server/store/roomStore";
import { toPublicRoom } from "../state/publicRoom";
import { detailQuestionPayloadSchema, validateWithZod } from "../schemas";

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
		setDetailQuestion(code, question);
		const room = getRoom(code);
		if (!room) return;
		io.to(code).emit("roomData", toPublicRoom(room));
	});
};
