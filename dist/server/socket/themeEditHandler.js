"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeEditHandler = void 0;
const theme_1 = require("../../lib/theme");
const rooms_1 = require("../../lib/rooms");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const themeEditHandler = (io, socket) => {
    // Expect payload with room code (string), to match your existing API style
    socket.on("THEME_EDIT", async ({ code, theme }) => {
        var _a, _b;
        const normalizedCode = (0, validation_1.parseRoomCode)(code);
        if (!normalizedCode)
            return;
        const boundRoom = (0, guards_1.requireRoom)(socket);
        if (!boundRoom || boundRoom.code !== normalizedCode)
            return;
        if (!(0, guards_1.requireHost)(socket, boundRoom))
            return;
        const trimmed = (_a = (0, validation_1.parseOptionalText)(theme)) !== null && _a !== void 0 ? _a : "";
        // Update in-memory room (Room.theme)
        const room = await (0, rooms_1.setRoomTheme)(normalizedCode, trimmed || null);
        if (!room)
            return;
        // Reset in-memory theme mini-game state whenever theme changes
        (0, theme_1.resetForNewTheme)(normalizedCode);
        // Broadcast new theme value (string | null -> undefined on client if you prefer)
        io.to(normalizedCode).emit("THEME_UPDATED", { theme: (_b = room.theme) !== null && _b !== void 0 ? _b : undefined });
    });
};
exports.themeEditHandler = themeEditHandler;
