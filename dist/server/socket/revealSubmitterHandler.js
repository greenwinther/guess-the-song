"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revealSubmitterHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const gameState_1 = require("../state/gameState");
const phase_1 = require("../logic/phase");
const rooms_1 = require("@/lib/rooms");
const revealSubmitterHandler = (io, socket) => {
    socket.on("revealSubmitter", (data) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        const songId = (0, validation_1.parseIntSafe)(data.songId);
        if (!code || songId == null)
            return;
        const room = (0, guards_1.requireRoom)(socket);
        if (!room || room.code !== code)
            return;
        if (!(0, guards_1.requireHost)(socket, room))
            return;
        if (!(0, phase_1.isPhase)(room, ["GUESSING", "RECAP", "RESULTS"]))
            return;
        (0, gameState_1.addRevealedSong)(code, songId);
        const list = (0, gameState_1.getRoomGameState)(code).revealedSongs;
        io.to(code).emit("submitterRevealed", { songId });
        io.to(code).emit("revealedSongs", list);
    });
    socket.on("revealSubmitterAll", async (data) => {
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return;
        const room = (0, guards_1.requireRoom)(socket);
        if (!room || room.code !== code)
            return;
        if (!(0, guards_1.requireHost)(socket, room))
            return;
        if (!(0, phase_1.isPhase)(room, ["RECAP", "RESULTS"]))
            return;
        const fullRoom = await (0, rooms_1.getRoom)(code);
        if (!fullRoom)
            return;
        const songIds = fullRoom.songs.map((s) => s.id);
        for (const id of songIds)
            (0, gameState_1.addRevealedSong)(code, id);
        const list = (0, gameState_1.getRoomGameState)(code).revealedSongs;
        io.to(code).emit("submitterRevealedAll", { songIds });
        io.to(code).emit("revealedSongs", list);
    });
};
exports.revealSubmitterHandler = revealSubmitterHandler;
