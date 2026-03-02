// // src/server/socket/showResultHandler.ts
import { getRoundsForCode } from "../../lib/game";
import type { Server, Socket } from "socket.io";
import { setFinalScores } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, ShowResultsPayload, SocketData } from "@/types/socket";
import { parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { computeScoreBoard } from "../logic/score";
import { getRoomScores } from "@/lib/score";
import { getRoom } from "@/lib/rooms";
import { isPhase } from "../logic/phase";
import { setPhase } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";
import { scopedLogger } from "../logger";

const log = scopedLogger("socket.showResults");

export const showResultHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("showResults", async (data: ShowResultsPayload, callback: (ok: boolean) => void) => {
		try {
			const code = parseRoomCode(data.code);
			if (!code) return callback(false);

			const boundRoom = requireRoom(socket, () => callback(false));
			if (!boundRoom) return;
			if (boundRoom.code !== code) return callback(false);
			if (!requireHost(socket, boundRoom, () => callback(false))) return;
			if (!isPhase(boundRoom, ["GUESSING", "RECAP"])) return callback(false);

			const room = await getRoom(code);
			const roundsForCode = getRoundsForCode(code);
			const themePoints = getRoomScores(code);
			const board = computeScoreBoard({
				room,
				rounds: roundsForCode,
				themePointsByPlayer: themePoints,
				hardcoreMultiplier: room.rules.hardcoreMultiplier,
			});
			const finalScores = Object.fromEntries(
				Object.entries(board.byPlayer).map(([name, row]) => [name, row.total])
			);

			// 1) cache them
			setFinalScores(code, finalScores);

			// 2) broadcast the end-of-game
			const updated = setPhase(code, "RESULTS");
			io.to(code).emit("gameOver", { scores: finalScores });
			if (updated) io.to(code).emit("roomData", toPublicRoom(updated));
			callback(true);
		} catch (err) {
			log.error({ err, code: data.code }, "showResults error");
			callback(false);
		}
	});
};
