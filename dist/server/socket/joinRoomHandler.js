"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoomHandler = void 0;
// src/server/socket/joinRoomHandler.ts
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const sharedState_1 = require("./sharedState");
const joinRoomHandler = (io, socket) => {
    socket.on("joinRoom", async (data, callback) => {
        try {
            // …persist the newPlayer, join the socket…
            const newPlayer = await (0, rooms_1.joinRoom)(data.code, data.name);
            socket.join(data.code);
            // Store room + playerName on socket.data so we know, on disconnect, who to remove
            socket.data.roomMeta = { code: data.code, playerName: data.name };
            io.to(data.code).emit("playerJoined", newPlayer);
            // 1) Always send the freshest Room to this socket
            const room = await (0, rooms_1.getRoom)(data.code);
            io.to(data.code).emit("playerJoined", newPlayer);
            socket.emit("roomData", room);
            const revealed = sharedState_1.revealedSongsByRoom[data.code] || [];
            socket.emit("revealedSongs", revealed);
            // 2) If a round is already active, immediately tell them the game has started
            const roundsForCode = game_1.activeRounds[data.code];
            if (roundsForCode && Object.keys(roundsForCode).length > 0) {
                // Emit gameStarted so that JoinGameClient can flip state.gameStarted = true
                socket.emit("gameStarted", room);
            }
            // 3) If the game is over already, send results
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
