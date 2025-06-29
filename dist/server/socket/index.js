"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = void 0;
const createRoomHandler_1 = require("./createRoomHandler");
const disconnectHandler_1 = require("./disconnectHandler");
const addSongHandler_1 = require("./addSongHandler");
const playSongHandler_1 = require("./playSongHandler");
const removeSongHandler_1 = require("./removeSongHandler");
const showResultsHandler_1 = require("./showResultsHandler");
const startGameHandler_1 = require("./startGameHandler");
const submitAllOrdersHandler_1 = require("./submitAllOrdersHandler");
const joinRoomHandler_1 = require("./joinRoomHandler");
const registerSocketHandlers = (io, socket) => {
    (0, createRoomHandler_1.createRoomHandler)(io, socket);
    (0, joinRoomHandler_1.joinRoomHandler)(io, socket);
    (0, disconnectHandler_1.disconnectHandler)(io, socket);
    (0, addSongHandler_1.addSongHandler)(io, socket);
    (0, playSongHandler_1.playSongHandler)(io, socket);
    (0, removeSongHandler_1.removeSongHandler)(io, socket);
    (0, showResultsHandler_1.showResultHandler)(io, socket);
    (0, startGameHandler_1.startGameHandler)(io, socket);
    (0, submitAllOrdersHandler_1.submitAllOrdersHandler)(io, socket);
};
exports.registerSocketHandlers = registerSocketHandlers;
