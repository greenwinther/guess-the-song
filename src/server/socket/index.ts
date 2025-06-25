// src/server/socket/index.ts
import { Server, Socket } from "socket.io";
import { createRoomHandler } from "./createRoomHandler";
import { disconnectHandler } from "./disconnectHandler";
import { addSongHandler } from "./addSongHandler";
import { playSongHandler } from "./playSongHandler";
import { removeSongHandler } from "./removeSongHandler";
import { showResultHandler } from "./showResultsHandler";
import { startGameHandler } from "./startGameHandler";
import { submitAllOrdersHandler } from "./submitAllOrdersHandler";
import { joinRoomHandler } from "./joinRoomHandler";

export const registerSocketHandlers = (io: Server, socket: Socket) => {
	createRoomHandler(io, socket);
	joinRoomHandler(io, socket);
	disconnectHandler(io, socket);
	addSongHandler(io, socket);
	playSongHandler(io, socket);
	removeSongHandler(io, socket);
	showResultHandler(io, socket);
	startGameHandler(io, socket);
	submitAllOrdersHandler(io, socket);
};
