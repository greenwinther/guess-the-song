"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const prisma_1 = require("../../lib/prisma");
const disconnectHandler = (io, socket) => {
    socket.on("disconnect", async (reason) => {
        var _a, _b;
        console.log("↔️ socket disconnected", socket.id, reason);
        const meta = socket.data.roomMeta;
        if (!meta)
            return;
        const { code, playerName } = meta;
        try {
            const before = await (0, rooms_1.getRoom)(code);
            const leftPlayer = before.players.find((p) => p.name === playerName);
            if (!leftPlayer)
                return;
            console.log(`🚨 Player "${leftPlayer.name}" (id: ${leftPlayer.id}) left room ${code}`);
            await prisma_1.prisma.player.delete({ where: { id: leftPlayer.id } });
            const socketsInRoom = (_b = (_a = io.sockets.adapter.rooms.get(code)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
            if (socketsInRoom === 0) {
                // Inga aktiva connections i rummet -> ta bort hela rummet
                try {
                    await prisma_1.prisma.room.delete({ where: { code } });
                    console.log(`🧹 Deleted empty room ${code}`);
                }
                catch (e) {
                    console.error("Failed deleting empty room", e);
                }
            }
            else {
                // fortfarande folk kvar → skicka färsk snapshot
                const after = await (0, rooms_1.getRoom)(code);
                io.to(code).emit("roomData", after);
            }
            // notify first, then send fresh snapshot
            io.to(code).emit("playerLeft", leftPlayer.id);
            const after = await (0, rooms_1.getRoom)(code);
            io.to(code).emit("roomData", after);
        }
        catch (err) {
            console.error("[disconnect] cleanup error", err);
        }
    });
};
exports.disconnectHandler = disconnectHandler;
