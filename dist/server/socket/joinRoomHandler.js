"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinRoomHandler = void 0;
// src/server/socket/joinRoomHandler.ts
const game_1 = require("../../lib/game");
const rooms_1 = require("../../lib/rooms");
const sharedState_1 = require("../sharedState");
const joinRoomHandler = (io, socket) => {
    socket.on("joinRoom", async (data, callback) => {
        var _a, _b, _c;
        try {
            // prevent duplicate joins from same socket
            if (((_a = socket.data.roomMeta) === null || _a === void 0 ? void 0 : _a.code) === data.code &&
                ((_b = socket.data.roomMeta) === null || _b === void 0 ? void 0 : _b.playerName) === data.name) {
                callback === null || callback === void 0 ? void 0 : callback(true);
                return;
            }
            const { player, created } = await (0, rooms_1.joinRoom)(data.code, data.name, !!data.hardcore);
            socket.join(data.code);
            socket.data.roomMeta = { code: data.code, playerName: data.name };
            if (created && player.name !== "Host") {
                io.to(data.code).emit("playerJoined", player);
            }
            const room = await (0, rooms_1.getRoom)(data.code);
            socket.emit("roomData", room);
            const revealed = sharedState_1.revealedSongsByRoom[data.code] || [];
            socket.emit("revealedSongs", revealed);
            const roundsForCode = game_1.activeRounds[data.code];
            if (roundsForCode && Object.keys(roundsForCode).length > 0) {
                socket.emit("gameStarted", room);
            }
            const activeId = (_c = sharedState_1.activeSongByRoom[data.code]) !== null && _c !== void 0 ? _c : null;
            socket.emit("songChanged", { songId: activeId });
            if (activeId) {
                const locked = (0, game_1.getLockedPlayers)(data.code, activeId);
                socket.emit("lockSnapshot", { songId: activeId, locked });
            }
            if (sharedState_1.finalScoresByRoom[data.code]) {
                socket.emit("gameOver", { scores: sharedState_1.finalScoresByRoom[data.code] });
            }
            callback === null || callback === void 0 ? void 0 : callback(true);
        }
        catch (err) {
            console.error("🔔 joinRoom error:", err);
            callback === null || callback === void 0 ? void 0 : callback(false);
        }
    });
};
exports.joinRoomHandler = joinRoomHandler;
