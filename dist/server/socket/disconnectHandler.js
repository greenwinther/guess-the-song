"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const prisma_1 = require("../../lib/prisma");
const disconnectHandler = (io, socket) => {
    socket.on("disconnect", async (reason) => {
        console.log("↔️ socket disconnected", socket.id);
        console.log(`↔️ socket ${socket.id} disconnected:`, reason);
        const meta = socket.data.roomMeta;
        if (meta) {
            const { code, playerName } = meta;
            try {
                const updated = await (0, rooms_1.getRoom)(code);
                if (!updated)
                    return;
                // Find the player before removing them
                const leftPlayer = updated.players.find((p) => p.name === playerName);
                if (!leftPlayer)
                    return;
                console.log(`🚨 Player "${leftPlayer.name}" (id: ${leftPlayer.id}) left room ${code}`);
                // Remove from room
                await prisma_1.prisma.player.delete({
                    where: { id: leftPlayer.id },
                });
                // Notify other clients
                io.to(code).emit("playerLeft", leftPlayer.id);
                io.to(code).emit("roomData", updated);
            }
            catch (err) {
                console.error("[disconnect] cleanup error", err);
            }
        }
    });
};
exports.disconnectHandler = disconnectHandler;
