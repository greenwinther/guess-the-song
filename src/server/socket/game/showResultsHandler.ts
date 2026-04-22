// // src/server/socket/showResultHandler.ts
import { getRoundsForCode } from "@/lib/game";
import type { Server, Socket } from "socket.io";
import { setFinalScores } from "@/server/state/gameState";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, ShowResultsPayload, SocketData } from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { computeScoreBoard } from "@/server/logic/score";
import { getRoomScores } from "@/lib/score";
import { getRoom } from "@/lib/rooms";
import { isPhase } from "@/server/logic/phase";
import { setPhase } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import { scopedLogger } from "@/server/logger";
import { showResultsPayloadSchema, validateWithZod } from "@/server/schemas";

const log = scopedLogger("socket.showResults");

export const showResultHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("showResults", async (data: ShowResultsPayload, callback: (ok: boolean) => void) => {
		try {
			const payload = validateWithZod(showResultsPayloadSchema, data, {
				errorMessage: "Invalid showResults payload",
			});
			if (!payload.ok) return callback(false);
			const { code } = payload.data;

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
			const hostNames = new Set(room.players.filter((player) => player.isHost).map((player) => player.name));
			const finalScores = Object.fromEntries(
				Object.entries(board.byPlayer)
					.filter(([name]) => !hostNames.has(name))
					.map(([name, row]) => [name, row.total])
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
