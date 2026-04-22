import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	KickPlayerPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { removePlayerByName, getRoom, setPlayerKicked } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { removePlayerFromRounds } from "@/lib/game";
import { removePlayerScore } from "@/lib/score";
import { removePlayerFromThemeState } from "@/lib/theme";
import { scopedLogger } from "@/server/logger";
import { kickPlayerPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.kickPlayer");

export const kickPlayerHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("kickPlayer", async (data: KickPlayerPayload, cb?: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(kickPlayerPayloadSchema, data, {
				errorMessage: "Invalid kickPlayer payload",
			});
			if (!payload.ok) return cb?.(false);
			const { code, playerName } = payload.data;

			const room = requireRoom(socket, () => cb?.(false));
			if (!room || room.code !== code) return;
			if (!requireHost(socket, room, () => cb?.(false))) return;
			if (room.players.find((p) => p.name === playerName)?.isHost) return cb?.(false);

			const removed = removePlayerByName(code, playerName);
			if (!removed) return cb?.(false);

			setPlayerKicked(code, removed.name);
			removePlayerFromRounds(code, removed.name);
			removePlayerScore(code, removed.name);
			removePlayerFromThemeState(code, removed.name);

			const updated = getRoom(code);
			if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
			io.to(code).emit("playerLeft", removed.id);

			// Disconnect any sockets for this player
			const sockets = await io.in(code).fetchSockets();
			for (const s of sockets) {
				const meta = s.data.roomMeta;
				if (!meta) continue;
				if (meta.playerName.toLowerCase() === removed.name.toLowerCase()) {
					s.emit("joinDenied", { reason: "kicked" });
					setTimeout(() => s.disconnect(true), 100);
				}
			}

			cb?.(true);
		} catch (err) {
			log.error({ err, code: data.code, playerName: data.playerName }, "kickPlayer error");
			cb?.(false);
		}
	});
};
