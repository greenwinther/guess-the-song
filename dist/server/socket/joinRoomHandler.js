"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoomHandler = void 0;
// src/server/socket/joinRoomHandler.ts
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const sharedState_1 = require("../sharedState");
const joinRoomHandler = (io, socket) => {
    socket.on("joinRoom", async (data, callback) => {
        var _a, _b;
        try {
            // 1) Add player to room
            const newPlayer = await (0, rooms_1.joinRoom)(data.code, data.name, !!data.hardcore);
            socket.join(data.code);
            // 2) Store for disconnect tracking
            socket.data.roomMeta = { code: data.code, playerName: data.name };
            // ✅ Only emit playerJoined if it's not the host
            if (newPlayer.name !== "Host") {
                io.to(data.code).emit("playerJoined", newPlayer);
            }
            // 3) Always send full room data to just this socket
            const room = await (0, rooms_1.getRoom)(data.code);
            socket.emit("roomData", room);
            // 4) Also send current revealed songs
            const revealed = sharedState_1.revealedSongsByRoom[data.code] || [];
            socket.emit("revealedSongs", revealed);
            // 5) If game already started, tell the client
            const roundsForCode = game_1.activeRounds[data.code];
            if (roundsForCode && Object.keys(roundsForCode).length > 0) {
                // Emit gameStarted so that JoinGameClient can flip state.gameStarted = true
                socket.emit("gameStarted", room);
            }
            socket.emit("songChanged", { songId: (_a = sharedState_1.activeSongByRoom[data.code]) !== null && _a !== void 0 ? _a : null });
            const activeId = (_b = sharedState_1.activeSongByRoom[data.code]) !== null && _b !== void 0 ? _b : null;
            if (activeId) {
                const locked = (0, game_1.getLockedPlayers)(data.code, activeId);
                socket.emit("lockSnapshot", { songId: activeId, locked });
            }
            // 6) If game is over, send final scores
            if (sharedState_1.finalScoresByRoom[data.code]) {
                socket.emit("gameOver", {
                    scores: sharedState_1.finalScoresByRoom[data.code],
                });
            }
            if (typeof callback === "function")
                callback(true);
        }
        catch (err) {
            console.error("🔔 joinRoom error:", err);
            if (typeof callback === "function")
                callback(false);
        }
    });
};
exports.joinRoomHandler = joinRoomHandler;
