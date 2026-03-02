"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealedSongsHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const gameState_1 = require("../state/gameState");
const phase_1 = require("../logic/phase");
const revealedSongsHandler = (io, socket) => {
    socket.on("revealedSongs", (data) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return;
        const room = (0, guards_1.requireRoom)(socket);
        if (!room || room.code !== code)
            return;
        if (!(0, guards_1.requireHost)(socket, room))
            return;
        if (!(0, phase_1.isPhase)(room, ["GUESSING", "RECAP", "RESULTS"]))
            return;
        const list = Array.isArray(data.revealed) ? data.revealed.filter((n) => Number.isFinite(n)) : [];
        (0, gameState_1.setRevealedSongs)(code, list);
        io.to(code).emit("revealedSongs", list);
    });
};
exports.revealedSongsHandler = revealedSongsHandler;
