"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGameHandler = void 0;
// // src/server/socket/startGameHandler.ts
const game_1 = require("@/lib/game");
const rooms_1 = require("@/lib/rooms");
const sharedState_1 = require("./sharedState");
const startGameHandler = (io, socket) => {
    socket.on("startGame", async (data, callback) => {
        try {
            // 1) Fetch the room and its songs
            const room = await (0, rooms_1.getRoom)(data.code);
            if (!room)
                return callback(false);
            // 2) For each song in that room, create a RoundData entry
            //    so that every songId is known up front, with the correctAnswer=submitter
            for (const song of room.songs) {
                // song.id is the unique ID
                // song.submitter is the correct answer for that song
                (0, game_1.startRoundData)(data.code, song.id, song.submitter, room.songs.map((s) => s.submitter));
                // Note: we pass the full list of all submitters, but computeScores only cares about correctAnswer.
            }
            // 3) Broadcast “gameStarted” with the full room so clients can build their guess UI.
            sharedState_1.gamesInProgress[data.code] = true;
            io.to(data.code).emit("gameStarted", room);
            callback(true);
        }
        catch (err) {
            console.error("startGame error", err);
            callback(false);
        }
    });
};
exports.startGameHandler = startGameHandler;
