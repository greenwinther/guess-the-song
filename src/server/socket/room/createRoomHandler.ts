import type { Server, Socket } from "socket.io";
import { createRoom } from "@/lib/rooms";
import type {
	ClientToServerEvents,
	CreateRoomPayload,
	CreateRoomResponse,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { toPublicRoom } from "@/server/state/publicRoom";
import { scopedLogger } from "@/server/logger";
import { createRoomPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.createRoom");

export const createRoomHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("createRoom", async (data: CreateRoomPayload, callback: (resp: CreateRoomResponse) => void) => {
		try {
			const payload = validateWithZod(createRoomPayloadSchema, data, {
				errorMessage: "Invalid createRoom payload",
			});
			if (!payload.ok) {
				return callback({
					code: "",
					theme: null,
					backgroundUrl: undefined,
					hostName: "Host",
					error: payload.issues[0]?.message ?? payload.error,
				});
			}

			const { theme, backgroundUrl, hostName, avatar } = payload.data;

			const newRoom = await createRoom(theme, backgroundUrl, hostName, avatar);

			socket.join(newRoom.code);

			// Optionally store socket.id of host if you want later control

			callback({
				code: newRoom.code,
				theme: newRoom.theme,
				backgroundUrl: newRoom.backgroundUrl || undefined,
				hostName, // return this if needed on client
			});

			io.to(newRoom.code).emit("roomData", toPublicRoom(newRoom)); // includes host in players
		} catch (err: unknown) {
			log.error({ err }, "createRoom handler error");
			const message = err instanceof Error ? err.message : "Unknown error";
			callback({
				code: "",
				theme: null,
				backgroundUrl: undefined,
				hostName: data?.hostName ?? "Host",
				error: message,
			});
		}
	});
};
