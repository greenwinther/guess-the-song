import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { adminDashboardHandler } from "./admin/adminDashboardHandler";
import { devSeedHandler } from "./dev/devSeedHandler";
import { nextSongHandler } from "./game/nextSongHandler";
import { playSongHandler } from "./game/playSongHandler";
import { revealedSongsHandler } from "./game/revealedSongsHandler";
import { revealSubmitterHandler } from "./game/revealSubmitterHandler";
import { showResultHandler } from "./game/showResultsHandler";
import { startGameHandler } from "./game/startGameHandler";
import { lockAnswerHandler } from "./guesses/lockAnswerHandler";
import { lockDetailAnswerHandler } from "./guesses/lockDetailAnswerHandler";
import { selectDetailOrderHandler } from "./guesses/selectDetailOrderHandler";
import { selectOrderHandler } from "./guesses/selectOrderHandler";
import { submitAllOrdersHandler } from "./guesses/submitAllOrdersHandler";
import { hardcoreRequiredHandler } from "./player-settings/hardcoreRequiredHandler";
import { playerHardcoreHandler } from "./player-settings/playerHardcoreHandler";
import { playerReadyHandler } from "./player-settings/playerReadyHandler";
import { addSongHandler } from "./playlist/addSongHandler";
import { removeSongHandler } from "./playlist/removeSongHandler";
import { updateSongHandler } from "./playlist/updateSongHandler";
import { createRoomHandler } from "./room/createRoomHandler";
import { debugSnapshotHandler } from "./room/debugSnapshotHandler";
import { disconnectHandler } from "./room/disconnectHandler";
import { joinRoomHandler } from "./room/joinRoomHandler";
import { kickPlayerHandler } from "./room/kickPlayerHandler";
import { resyncHandler } from "./room/resyncHandler";
import { detailQuestionHandler } from "./theme/detailQuestionHandler";
import { themeEditHandler } from "./theme/themeEditHandler";
import { themeGuessHandler } from "./theme/themeGuessHandler";

export const registerSocketHandlers = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	createRoomHandler(io, socket);
	joinRoomHandler(io, socket);
	disconnectHandler(io, socket);
	kickPlayerHandler(io, socket);
	resyncHandler(io, socket);
	debugSnapshotHandler(io, socket);

	addSongHandler(io, socket);
	updateSongHandler(io, socket);
	removeSongHandler(io, socket);

	startGameHandler(io, socket);
	playSongHandler(io, socket);
	nextSongHandler(io, socket);
	showResultHandler(io, socket);
	revealedSongsHandler(io, socket);
	revealSubmitterHandler(io, socket);

	selectOrderHandler(io, socket);
	selectDetailOrderHandler(io, socket);
	submitAllOrdersHandler(io, socket);
	lockAnswerHandler(io, socket);
	lockDetailAnswerHandler(io, socket);

	themeEditHandler(io, socket);
	detailQuestionHandler(io, socket);
	themeGuessHandler(io, socket);

	hardcoreRequiredHandler(io, socket);
	playerHardcoreHandler(io, socket);
	playerReadyHandler(io, socket);

	adminDashboardHandler(io, socket);
	devSeedHandler(io, socket);
};
