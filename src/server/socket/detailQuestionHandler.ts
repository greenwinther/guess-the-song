// src/server/socket/detailQuestionHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	DetailQuestionPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseOptionalText, parseRoomCode } from "../validation";
import { setDetailQuestion, getRoom } from "@/server/store/roomStore";
import { toPublicRoom } from "../state/publicRoom";

export const detailQuestionHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("DETAIL_QUESTION", (data: DetailQuestionPayload) => {
		const code = parseRoomCode(data.code);
		if (!code) return;
		const question = parseOptionalText(data.question);
		setDetailQuestion(code, question);
		const room = getRoom(code);
		if (!room) return;
		io.to(code).emit("roomData", toPublicRoom(room));
	});
};
