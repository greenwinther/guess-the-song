"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kickPlayerHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const game_1 = require("@/lib/game");
const score_1 = require("@/lib/score");
const theme_1 = require("@/lib/theme");
const kickPlayerHandler = (io, socket) => {
    socket.on("kickPlayer", async (data, cb) => {
        var _a;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const playerName = (0, validation_1.parseName)(data.playerName, "Player");
            const room = (0, guards_1.requireRoom)(socket, () => cb === null || cb === void 0 ? void 0 : cb(false));
            if (!room || room.code !== code)
                return;
            if (!(0, guards_1.requireHost)(socket, room, () => cb === null || cb === void 0 ? void 0 : cb(false)))
                return;
            if ((_a = room.players.find((p) => p.name === playerName)) === null || _a === void 0 ? void 0 : _a.isHost)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            const removed = (0, roomStore_1.removePlayerByName)(code, playerName);
            if (!removed)
                return cb === null || cb === void 0 ? void 0 : cb(false);
            (0, roomStore_1.setPlayerKicked)(code, removed.name);
            (0, game_1.removePlayerFromRounds)(code, removed.name);
            (0, score_1.removePlayerScore)(code, removed.name);
            (0, theme_1.removePlayerFromThemeState)(code, removed.name);
            const updated = (0, roomStore_1.getRoom)(code);
            if (updated)
                io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
            io.to(code).emit("playerLeft", removed.id);
            // Disconnect any sockets for this player
            const sockets = await io.in(code).fetchSockets();
            for (const s of sockets) {
                const meta = s.data.roomMeta;
                if (!meta)
                    continue;
                if (meta.playerName.toLowerCase() === removed.name.toLowerCase()) {
                    s.emit("joinDenied", { reason: "kicked" });
                    setTimeout(() => s.disconnect(true), 100);
                }
            }
            cb === null || cb === void 0 ? void 0 : cb(true);
        }
        catch (err) {
            console.error("kickPlayer error", err);
            cb === null || cb === void 0 ? void 0 : cb(false);
        }
    });
};
exports.kickPlayerHandler = kickPlayerHandler;
