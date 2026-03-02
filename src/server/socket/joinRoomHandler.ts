// src/server/socket/joinRoomHandler.ts
import { activeRounds, detailLockCounts, getDetailLockedPlayers, getLockedPlayers, lockCounts } from "../../lib/game";
import { getRoom, joinRoom } from "../../lib/rooms";
import type { Server, Socket } from "socket.io";
import { getRoomGameState } from "../state/gameState";
import type { ClientToServerEvents, InterServerEvents, JoinRoomPayload, ServerToClientEvents, SocketData } from "@/types/socket";
import { parseAvatarConfig, parseBool, parseName, parseRoomCode } from "../validation";
import { toPublicRoom } from "../state/publicRoom";
import { getHint, getLockedThisRoundList, getSolvedList, isRevealed } from "@/lib/theme";

export const joinRoomHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	const emitLockSnapshots = (code: string) => {
		const roundsForCode = activeRounds[code];
		if (!roundsForCode) return;
		for (const songIdStr of Object.keys(roundsForCode)) {
			const songId = Number(songIdStr);
			const lockedNames = getLockedPlayers(code, songId);
			if (!lockedNames.length) continue;
			const counts = lockCounts(code, songId);
			socket.emit("songFinalized", { songId, mode: "snapshot", counts, lockedNames });
		}
	};
	const emitDetailSnapshots = (code: string) => {
		const roundsForCode = activeRounds[code];
		if (!roundsForCode) return;
		for (const songIdStr of Object.keys(roundsForCode)) {
			const songId = Number(songIdStr);
			const lockedNames = getDetailLockedPlayers(code, songId);
			if (!lockedNames.length) continue;
			const counts = detailLockCounts(code, songId);
			socket.emit("detailFinalized", { songId, mode: "snapshot", counts, lockedNames });
		}
	};

	socket.on(
		"joinRoom",
		async (
			data: JoinRoomPayload,
			callback?: (ok: boolean) => void
		) => {
			try {
				const code = parseRoomCode(data.code);
				if (!code) return callback?.(false);
				const name = parseName(data.name, "Player");
				const hardcore = parseBool(data.hardcore, false);
				const avatar = parseAvatarConfig(data.avatar) ?? undefined;
				const normalizeName = (value: string) => value.trim().toLowerCase();

				// prevent duplicate joins from same socket, but still send snapshot
				if (
					socket.data.roomMeta?.code === code &&
					normalizeName(socket.data.roomMeta?.playerName ?? "") === normalizeName(name)
				) {
					const room = await getRoom(code);
					socket.emit("roomData", toPublicRoom(room));
					const gameState = getRoomGameState(code);
					socket.emit("revealedSongs", gameState.revealedSongs || []);
				const activeId = gameState.activeSongId ?? null;
				socket.emit("songChanged", { songId: activeId });
				if (activeId) {
					const locked = getLockedPlayers(code, activeId);
					socket.emit("lockSnapshot", { songId: activeId, locked });
					const detailLocked = getDetailLockedPlayers(code, activeId);
					socket.emit("detailLockSnapshot", { songId: activeId, locked: detailLocked });
				}
				emitLockSnapshots(code);
				emitDetailSnapshots(code);
				const hint = getHint(code);
				if (hint) socket.emit("THEME_HINT_READY", { obfuscated: hint });
				if (isRevealed(code)) socket.emit("THEME_REVEALED");
				for (const playerName of getSolvedList(code)) {
					socket.emit("THEME_SOLVED", { playerName });
				}
				for (const playerName of getLockedThisRoundList(code)) {
					socket.emit("THEME_GUESSED_THIS_ROUND", { playerName });
				}
				if (gameState.finalScores) {
					socket.emit("gameOver", { scores: gameState.finalScores });
				}
					callback?.(true);
					return;
				}

				const { player, created } = await joinRoom(code, name, hardcore, avatar);
				socket.join(code);

				socket.data.roomMeta = { code, playerName: player.name };

				if (created && player.name !== "Host") {
					io.to(code).emit("playerJoined", player);
				}

				const room = await getRoom(code);
				socket.emit("roomData", toPublicRoom(room));

				const gameState = getRoomGameState(code);
				const revealed = gameState.revealedSongs || [];
				socket.emit("revealedSongs", revealed);

				const roundsForCode = activeRounds[code];
				if (roundsForCode && Object.keys(roundsForCode).length > 0) {
					socket.emit("gameStarted", toPublicRoom(room));
				}

				const activeId = gameState.activeSongId ?? null;
				socket.emit("songChanged", { songId: activeId });
				if (activeId) {
					const locked = getLockedPlayers(code, activeId);
					socket.emit("lockSnapshot", { songId: activeId, locked });
					const detailLocked = getDetailLockedPlayers(code, activeId);
					socket.emit("detailLockSnapshot", { songId: activeId, locked: detailLocked });
				}
				emitLockSnapshots(code);
				emitDetailSnapshots(code);
				const hint = getHint(code);
				if (hint) socket.emit("THEME_HINT_READY", { obfuscated: hint });
				if (isRevealed(code)) socket.emit("THEME_REVEALED");
				for (const playerName of getSolvedList(code)) {
					socket.emit("THEME_SOLVED", { playerName });
				}
				for (const playerName of getLockedThisRoundList(code)) {
					socket.emit("THEME_GUESSED_THIS_ROUND", { playerName });
				}

				if (gameState.finalScores) {
					socket.emit("gameOver", { scores: gameState.finalScores });
				}

				callback?.(true);
			} catch (err) {
				console.error("joinRoom error:", err);
				const reason =
					err instanceof Error && err.message === "Kicked"
						? "kicked"
						: err instanceof Error && err.message === "Room closed"
							? "closed"
							: err instanceof Error && err.message === "Room not found"
								? "not_found"
								: "error";
				socket.emit("joinDenied", { reason });
				callback?.(false);
			}
		}
	);
};
