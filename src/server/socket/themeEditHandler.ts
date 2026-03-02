import type { Server, Socket } from "socket.io";
import { resetForNewTheme } from "../../lib/theme";
import { setRoomTheme } from "../../lib/rooms";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, ThemeEditPayload } from "@/types/socket";
import { requireHost, requireRoom } from "../logic/guards";
import { themeEditPayloadSchema, validateWithZod } from "../schemas";

export const themeEditHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	// Expect payload with room code (string), to match your existing API style
	socket.on("THEME_EDIT", async (data: ThemeEditPayload) => {
		const payload = validateWithZod(themeEditPayloadSchema, data, {
			errorMessage: "Invalid THEME_EDIT payload",
		});
		if (!payload.ok) return;
		const { code: normalizedCode, theme: trimmed } = payload.data;
		const boundRoom = requireRoom(socket);
		if (!boundRoom || boundRoom.code !== normalizedCode) return;
		if (!requireHost(socket, boundRoom)) return;

		// Update in-memory room (Room.theme)
		const room = await setRoomTheme(normalizedCode, trimmed || null);
		if (!room) return;

		// Reset in-memory theme mini-game state whenever theme changes
		resetForNewTheme(normalizedCode);

		// Broadcast new theme value (string | null -> undefined on client if you prefer)
		io.to(normalizedCode).emit("THEME_UPDATED", { theme: room.theme ?? undefined });
	});
};
