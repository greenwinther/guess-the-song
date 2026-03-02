import type { Server, Socket } from "socket.io";
import { resetForNewTheme } from "../../lib/theme";
import { setRoomTheme } from "../../lib/rooms";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, ThemeEditPayload } from "@/types/socket";
import { parseOptionalText, parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";

export const themeEditHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	// Expect payload with room code (string), to match your existing API style
	socket.on("THEME_EDIT", async ({ code, theme }: ThemeEditPayload) => {
		const normalizedCode = parseRoomCode(code);
		if (!normalizedCode) return;
		const boundRoom = requireRoom(socket);
		if (!boundRoom || boundRoom.code !== normalizedCode) return;
		if (!requireHost(socket, boundRoom)) return;
		const trimmed = parseOptionalText(theme) ?? "";

		// Update in-memory room (Room.theme)
		const room = await setRoomTheme(normalizedCode, trimmed || null);
		if (!room) return;

		// Reset in-memory theme mini-game state whenever theme changes
		resetForNewTheme(normalizedCode);

		// Broadcast new theme value (string | null -> undefined on client if you prefer)
		io.to(normalizedCode).emit("THEME_UPDATED", { theme: room.theme ?? undefined });
	});
};
