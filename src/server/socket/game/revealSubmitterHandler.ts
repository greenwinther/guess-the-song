import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	InterServerEvents,
	RevealSubmitterAllPayload,
	RevealSubmitterPayload,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHost, requireRoom } from "@/server/logic/guards";
import { addRevealedSubmitter, getRoomGameState } from "@/server/state/gameState";
import { isPhase } from "@/server/logic/phase";
import { getRoom } from "@/lib/rooms";
import { finalizeDetailForPlayers, finalizeSongForPlayers, getDetailLockedPlayers, getLockedPlayers } from "@/lib/game";
import {
	revealSubmitterAllPayloadSchema,
	revealSubmitterPayloadSchema,
	validateWithZod,
} from "@/server/schemas";

export const revealSubmitterHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("revealSubmitter", (data: RevealSubmitterPayload) => {
		const payload = validateWithZod(revealSubmitterPayloadSchema, data, {
			errorMessage: "Invalid revealSubmitter payload",
		});
		if (!payload.ok) return;
		const { code, songId } = payload.data;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["REVEAL", "RESULTS"])) return;

		const players = room.players.filter((player) => !player.isHost).map((player) => player.name);
		const submitterLocks = finalizeSongForPlayers(code, songId, players, {
			multiplierEligible: false,
		});
		const detailLocks = finalizeDetailForPlayers(code, songId, players, {
			multiplierEligible: false,
		});
		addRevealedSubmitter(code, songId);
		const list = getRoomGameState(code).revealedSubmitters;
		const lockedNames = getLockedPlayers(code, songId);
		const detailLockedNames = getDetailLockedPlayers(code, songId);

		io.to(code).emit("submitterRevealed", { songId });
		io.to(code).emit("revealedSubmitters", list);
		io.to(code).emit("songFinalized", { songId, mode: "snapshot", counts: submitterLocks, lockedNames });
		if (detailLocks.total > 0) {
			io.to(code).emit("detailFinalized", {
				songId,
				mode: "snapshot",
				counts: detailLocks,
				lockedNames: detailLockedNames,
			});
		}
	});

	socket.on("revealSubmitterAll", async (data: RevealSubmitterAllPayload) => {
		const payload = validateWithZod(revealSubmitterAllPayloadSchema, data, {
			errorMessage: "Invalid revealSubmitterAll payload",
		});
		if (!payload.ok) return;
		const { code } = payload.data;

		const room = requireRoom(socket);
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room)) return;
		if (!isPhase(room, ["REVEAL", "RESULTS"])) return;

		const fullRoom = await getRoom(code);
		if (!fullRoom) return;
		const songIds = fullRoom.songs.map((s) => s.id);
		const players = fullRoom.players.filter((player) => !player.isHost).map((player) => player.name);
		for (const id of songIds) {
			finalizeSongForPlayers(code, id, players, { multiplierEligible: false });
			finalizeDetailForPlayers(code, id, players, { multiplierEligible: false });
			addRevealedSubmitter(code, id);
		}
		const list = getRoomGameState(code).revealedSubmitters;

		io.to(code).emit("submitterRevealedAll", { songIds });
		io.to(code).emit("revealedSubmitters", list);
	});
};
