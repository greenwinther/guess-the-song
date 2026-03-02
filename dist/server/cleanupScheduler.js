"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCleanupScheduler = startCleanupScheduler;
const roomStore_1 = require("./store/roomStore");
const roomStateCleanup_1 = require("./roomStateCleanup");
let started = false;
function startCleanupScheduler(io, ms) {
    var _a;
    if (ms === void 0) { ms = Number((_a = process.env.CLEANUP_INTERVAL_MS) !== null && _a !== void 0 ? _a : 60000); }
    if (started)
        return console.warn("cleanupScheduler already started"), undefined;
    started = true;
    setInterval(async () => {
        var _a, _b;
        try {
            // ✅ no sockets at all? skip touching the DB.
            if (io.engine.clientsCount === 0)
                return;
            for (const [code] of (0, roomStore_1.iterRooms)()) {
                const socketsInRoom = (_b = (_a = io.sockets.adapter.rooms.get(code)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0;
                if (socketsInRoom === 0) {
                    (0, roomStore_1.deleteRoom)(code);
                    (0, roomStateCleanup_1.clearRoomState)(code);
                    console.log(`🧹 Cron: deleted empty room ${code}`);
                }
            }
        }
        catch (e) {
            console.error("Cleanup scheduler error:", e);
        }
    }, ms);
}
