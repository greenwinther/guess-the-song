// src/server/socket/kickPlayerHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	KickPlayerPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseName, parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { removePlayerByName, getRoom, setPlayerKicked } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";
import { removePlayerFromRounds } from "@/lib/game";
import { removePlayerScore } from "@/lib/score";
import { removePlayerFromThemeState } from "@/lib/theme";

export const kickPlayerHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("kickPlayer", async (data: KickPlayerPayload, cb?: (ok: boolean) => void) => {
		try {
			const code = parseRoomCode(data.code);
			if (!code) return cb?.(false);
			const playerName = parseName(data.playerName, "Player");

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
			console.error("kickPlayer error", err);
			cb?.(false);
		}
	});
};
