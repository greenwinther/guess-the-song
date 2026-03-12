// src/server/socket/index.ts
import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { createRoomHandler } from "./createRoomHandler";
import { disconnectHandler } from "./disconnectHandler";
import { addSongHandler } from "./addSongHandler";
import { updateSongHandler } from "./updateSongHandler";
import { playSongHandler } from "./playSongHandler";
import { removeSongHandler } from "./removeSongHandler";
import { showResultHandler } from "./showResultsHandler";
import { startGameHandler } from "./startGameHandler";
import { submitAllOrdersHandler } from "./submitAllOrdersHandler";
import { joinRoomHandler } from "./joinRoomHandler";
import { lockAnswerHandler } from "./lockAnswerHandler";
import { lockDetailAnswerHandler } from "./lockDetailAnswerHandler";
import { selectOrderHandler } from "./selectOrderHandler";
import { selectDetailOrderHandler } from "./selectDetailOrderHandler";
import { nextSongHandler } from "./nextSongHandler";
import { themeEditHandler } from "./themeEditHandler";
import { detailQuestionHandler } from "./detailQuestionHandler";
import { themeGuessHandler } from "./themeGuessHandler";
import { hardcoreRequiredHandler } from "./hardcoreRequiredHandler";
import { playerHardcoreHandler } from "./playerHardcoreHandler";
import { playerReadyHandler } from "./playerReadyHandler";
import { revealedSongsHandler } from "./revealedSongsHandler";
import { revealSubmitterHandler } from "./revealSubmitterHandler";
import { devSeedHandler } from "./devSeedHandler";
import { resyncHandler } from "./resyncHandler";
import { kickPlayerHandler } from "./kickPlayerHandler";
import { debugSnapshotHandler } from "./debugSnapshotHandler";
import { adminDashboardHandler } from "./adminDashboardHandler";

export const registerSocketHandlers = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	createRoomHandler(io, socket);
	joinRoomHandler(io, socket);
	disconnectHandler(io, socket);
	addSongHandler(io, socket);
	updateSongHandler(io, socket);
	playSongHandler(io, socket);
	removeSongHandler(io, socket);
	showResultHandler(io, socket);
	startGameHandler(io, socket);
	submitAllOrdersHandler(io, socket);
	lockAnswerHandler(io, socket);
	lockDetailAnswerHandler(io, socket);
	selectOrderHandler(io, socket);
	selectDetailOrderHandler(io, socket);
	nextSongHandler(io, socket);
	themeEditHandler(io, socket);
	detailQuestionHandler(io, socket);
	themeGuessHandler(io, socket);
	hardcoreRequiredHandler(io, socket);
	playerHardcoreHandler(io, socket);
	playerReadyHandler(io, socket);
	revealedSongsHandler(io, socket);
	revealSubmitterHandler(io, socket);
	devSeedHandler(io, socket);
	resyncHandler(io, socket);
	kickPlayerHandler(io, socket);
	debugSnapshotHandler(io, socket);
	adminDashboardHandler(io, socket);
};
