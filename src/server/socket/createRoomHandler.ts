// src/server/socket/createRoomHandler.ts
import type { Server, Socket } from "socket.io";
import { createRoom } from "../../lib/rooms";
import type {
	ClientToServerEvents,
	CreateRoomPayload,
	CreateRoomResponse,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseAvatarConfig, parseName, parseOptionalText, parseOptionalUrl } from "../validation";
import { toPublicRoom } from "../state/publicRoom";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.createRoom");

export const createRoomHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("createRoom", async (data: CreateRoomPayload, callback: (resp: CreateRoomResponse) => void) => {
		try {
			const theme = parseOptionalText(data.theme) ?? "";
			const backgroundUrl = parseOptionalUrl(data.backgroundUrl);
			const hostName = parseName(data.hostName, "Host");
			const avatar = parseAvatarConfig(data.avatar) ?? undefined;

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
