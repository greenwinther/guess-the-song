"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCleanupScheduler = startCleanupScheduler;
const prisma_1 = require("../lib/prisma");
let started = false;
function startCleanupScheduler(io, ms) {
    var _a;
    if (ms === void 0) { ms = Number((_a = process.env.CLEANUP_INTERVAL_MS) !== null && _a !== void 0 ? _a : 60000); }
    if (started) {
        console.warn("cleanupScheduler already started – skipping");
        return;
    }
    started = true;
    setInterval(async () => {
        var _a, _b;
        try {
            // Hämta alla rumkoder i DB
            const rooms = await prisma_1.prisma.room.findMany({ select: { code: true } });
            for (const { code } of rooms) {
                // Finns några sockets i Socket.IO-rummet med samma code?
                const socketsInRoom = (_b = (_a = io.sockets.adapter.rooms.get(code)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
                if (socketsInRoom === 0) {
                    // Inga anslutna → radera rummet (Songs/Players följer pga FK-cascade)
                    await prisma_1.prisma.room.delete({ where: { code } });
                    console.log(`🧹 Cron: deleted empty room ${code}`);
                }
            }
        }
        catch (e) {
            console.error("Cleanup scheduler error:", e);
        }
    }, ms);
}
