import { Server, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { resetForNewTheme } from "@/lib/theme";

export const themeEditHandler = (io: Server, socket: Socket) => {
	// Expect payload with room code (string), to match your existing API style
	socket.on("THEME_EDIT", async ({ code, theme }: { code: string; theme: string }) => {
		const trimmed = (theme ?? "").trim();

		// Update DB (Room.theme)
		const room = await prisma.room
			.update({
				where: { code },
				data: { theme: trimmed || null },
				select: { code: true, theme: true },
			})
			.catch(() => null);

		if (!room) return;

		// Reset in-memory theme mini-game state whenever theme changes
		resetForNewTheme(code);

		// Broadcast new theme value (string | null -> undefined on client if you prefer)
		io.to(code).emit("THEME_UPDATED", { theme: room.theme ?? undefined });
	});
};
