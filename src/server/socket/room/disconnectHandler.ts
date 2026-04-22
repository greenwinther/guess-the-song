import type { Server, Socket } from "socket.io";
import { getRoom, setPlayerConnected } from "@/server/store/roomStore";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { toPublicRoom } from "@/server/state/publicRoom";
import { scopedLogger } from "@/server/logger";

const log = scopedLogger("socket.disconnect");

export const disconnectHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("disconnect", async (reason) => {
		log.info({ socketId: socket.id, reason }, "socket disconnected");

		const meta = socket.data.roomMeta as { code: string; playerName: string } | undefined;
		if (!meta) return;

		const { code, playerName } = meta;

		try {
			const before = getRoom(code);
			if (!before) return;

			const updated = setPlayerConnected(code, playerName, false);
			if (updated) {
				io.to(code).emit("roomData", toPublicRoom(updated));
			}
		} catch (err) {
			log.error({ err, code, playerName }, "disconnect cleanup error");
		}
	});
};
