"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeEditHandler = void 0;
const prisma_1 = require("@/lib/prisma");
const theme_1 = require("@/lib/theme");
const themeEditHandler = (io, socket) => {
    // Expect payload with room code (string), to match your existing API style
    socket.on("THEME_EDIT", async ({ code, theme }) => {
        var _a;
        const trimmed = (theme !== null && theme !== void 0 ? theme : "").trim();
        // Update DB (Room.theme)
        const room = await prisma_1.prisma.room
            .update({
            where: { code },
            data: { theme: trimmed || null },
            select: { code: true, theme: true },
        })
            .catch(() => null);
        if (!room)
            return;
        // Reset in-memory theme mini-game state whenever theme changes
        (0, theme_1.resetForNewTheme)(code);
        // Broadcast new theme value (string | null -> undefined on client if you prefer)
        io.to(code).emit("THEME_UPDATED", { theme: (_a = room.theme) !== null && _a !== void 0 ? _a : undefined });
    });
};
exports.themeEditHandler = themeEditHandler;
