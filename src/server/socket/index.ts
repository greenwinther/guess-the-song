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
import { lockAnswerHandler } from "./lockAnswerHandler";
import { selectOrderHandler } from "./selectOrderHandler";
import { nextSongHandler } from "./nextSongHandler";
import { themeEditHandler } from "./themeEditHandler";
import { themeGuessHandler } from "./themeGuessHandler";

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
	lockAnswerHandler(io, socket);
	selectOrderHandler(io, socket);
	nextSongHandler(io, socket);
	themeEditHandler(io, socket);
	themeGuessHandler(io, socket);
};
