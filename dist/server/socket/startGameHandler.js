"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGameHandler = void 0;
// // src/server/socket/startGameHandler.ts
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const gameState_1 = require("../state/gameState");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const publicRoom_1 = require("../state/publicRoom");
const roomStore_1 = require("../store/roomStore");
const startGameHandler = (io, socket) => {
    socket.on("startGame", async (data, callback) => {
        var _a, _b, _c;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return callback(false);
            const boundRoom = (0, guards_1.requireRoom)(socket, () => callback(false));
            if (!boundRoom)
                return;
            if (boundRoom.code !== code)
                return callback(false);
            if (!(0, guards_1.requireHost)(socket, boundRoom, () => callback(false)))
                return;
            // 1) Fetch the room and its songs
            const room = await (0, rooms_1.getRoom)(code);
            if (!room)
                return callback(false);
            if (room.songs.length === 0)
                return callback(false);
            const hasDetailQuestion = !!room.detailQuestion &&
                room.songs.length > 0 &&
                room.songs.every((s) => { var _a; return ((_a = s.detailAnswer) !== null && _a !== void 0 ? _a : "").trim().length > 0; });
            const detailAnswers = hasDetailQuestion
                ? room.songs.map((s) => { var _a; return ((_a = s.detailAnswer) !== null && _a !== void 0 ? _a : "").trim(); })
                : [];
            // 2) For each song in that room, create a RoundData entry
            //    so that every songId is known up front, with the correctAnswer=submitter
            for (const song of room.songs) {
                // song.id is the unique ID
                // song.submitter is the correct answer for that song
                (0, game_1.startRoundData)(code, song.id, song.submitter, room.songs.map((s) => s.submitter), hasDetailQuestion
                    ? {
                        correctAnswer: ((_a = song.detailAnswer) !== null && _a !== void 0 ? _a : "").trim(),
                        answers: detailAnswers,
                    }
                    : undefined);
                // Note: we pass the full list of all submitters, but computeScores only cares about correctAnswer.
            }
            const firstId = (_c = (_b = room.songs[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null;
            (0, gameState_1.setActiveSong)(code, firstId);
            io.to(code).emit("songChanged", { songId: firstId });
            io.to(code).emit("lockSnapshot", { songId: firstId, locked: [] });
            if (hasDetailQuestion) {
                io.to(code).emit("detailLockSnapshot", { songId: firstId, locked: [] });
            }
            // 3) Broadcast "gameStarted" with the full room so clients can build their guess UI.
            (0, gameState_1.setGameStarted)(code, true);
            const updated = (0, roomStore_1.setPhase)(code, "GUESSING");
            io.to(code).emit("gameStarted", (0, publicRoom_1.toPublicRoom)(updated !== null && updated !== void 0 ? updated : room));
            callback(true);
        }
        catch (err) {
            console.error("startGame error", err);
            callback(false);
        }
    });
};
exports.startGameHandler = startGameHandler;
