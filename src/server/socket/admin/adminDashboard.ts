import type { Server } from "socket.io";
import { getRoundsForCode } from "@/lib/game";
import { getRoomScores } from "@/lib/score";
import {
	getHint,
	getLockedThisRoundList,
	getSolvedList,
	getThemeGuessesThisRound,
	isRevealed,
} from "@/lib/theme";
import { computeScoreBoard } from "@/server/logic/score";
import { getRoom } from "@/server/store/roomStore";
import { getRoomGameState } from "@/server/state/gameState";
import type {
	AdminDashboardPayload,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";

const toGuessLabel = (order: string[]) => {
	if (!order?.length) return "—";
	if (order.length === 1) return order[0] || "—";
	return order.filter(Boolean).join(" > ") || "—";
};

const isMultiplierEligible = (
	lock: { multiplierEligible?: boolean; hardcoreEligible?: boolean } | undefined
) => lock?.multiplierEligible ?? lock?.hardcoreEligible ?? false;

export function buildAdminDashboard(code: string): AdminDashboardPayload | null {
	const room = getRoom(code);
	if (!room) return null;

	const game = getRoomGameState(code);
	const rounds = getRoundsForCode(code);
	const activeSongId = game.activeSongId ?? null;
	const activeSongIndex =
		activeSongId != null ? room.songs.findIndex((song) => song.id === activeSongId) : -1;
	const activeRound = activeSongId != null ? rounds[activeSongId] : undefined;
	const currentSong = activeSongId != null ? room.songs.find((song) => song.id === activeSongId) : null;
	const hasDetailLane =
		!!room.detailQuestion &&
		room.songs.length > 0 &&
		room.songs.every((song) => (song.detailAnswer ?? "").trim().length > 0);

	const solved = new Set(getSolvedList(code));
	const guessedThisRound = new Set(getLockedThisRoundList(code));
	const themeGuessesThisRound = {
		...getThemeGuessesThisRound(code),
		...(activeRound?.themeGuesses ?? {}),
	};

	const scoreBoard = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: getRoomScores(code),
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
	});

	const currentSongRows = room.players
		.filter((player) => !player.isHost)
		.map((player) => {
			const lockInfo = activeRound?.locks?.[player.name];
			const detailLockInfo = activeRound?.detailLocks?.[player.name];
			const guessOrder = activeRound?.orders?.[player.name] ?? [];
			const detailOrder = activeRound?.detailOrders?.[player.name] ?? [];
			const themeGuess =
				activeRound?.themeGuesses?.[player.name] ?? themeGuessesThisRound[player.name] ?? null;
			return {
				playerName: player.name,
				guessOrder,
				guessLabel: toGuessLabel(guessOrder),
				locked: !!lockInfo?.locked,
				lockedAt: lockInfo?.lockedAt ?? null,
				detailOrder,
				detailLabel: toGuessLabel(detailOrder),
				detailLocked: !!detailLockInfo?.locked,
				detailLockedAt: detailLockInfo?.lockedAt ?? null,
				themeSolved: solved.has(player.name),
				themeGuessedThisRound: guessedThisRound.has(player.name),
				themeGuess,
			};
		});
	const playerHistories = room.players
		.filter((player) => !player.isHost)
		.map((player) => ({
			playerName: player.name,
			themeBonusPoints: scoreBoard.byPlayer[player.name]?.themeBonuses ?? 0,
			rounds: room.songs.map((song, index) => {
				const rd = rounds[song.id];
				const lockInfo = rd?.locks?.[player.name];
				const detailLockInfo = rd?.detailLocks?.[player.name];
				const guessOrder = rd?.orders?.[player.name] ?? [];
				const detailGuessOrder = rd?.detailOrders?.[player.name] ?? [];
				const correctAnswer = rd?.correctAnswer ?? song.submitter ?? "";
				const detailCorrectAnswer = rd?.detailCorrectAnswer ?? song.detailAnswer ?? null;
				const submitterCorrect = guessOrder[0] === correctAnswer;
				const detailCorrect =
					!!detailCorrectAnswer &&
					detailCorrectAnswer.trim().length > 0 &&
					detailGuessOrder[0] === detailCorrectAnswer;
				const submitterPoints = submitterCorrect ? room.rules.guessPoints : 0;
				const detailPoints = detailCorrect ? room.rules.detailGuessPoints : 0;
				const multiplierBonus =
					(submitterCorrect && isMultiplierEligible(lockInfo)
						? room.rules.guessPoints * (room.rules.hardcoreMultiplier - 1)
						: 0) +
					(detailCorrect && isMultiplierEligible(detailLockInfo)
						? room.rules.detailGuessPoints * (room.rules.hardcoreMultiplier - 1)
						: 0);
				const totalPoints = Math.round((submitterPoints + detailPoints + multiplierBonus) * 100) / 100;
				return {
					songId: song.id,
					songIndex: index + 1,
					songTitle: song.title ?? "",
					guessOrder,
					guessLabel: toGuessLabel(guessOrder),
					correctAnswer,
					locked: !!lockInfo?.locked,
					lockedAt: lockInfo?.lockedAt ?? null,
					detailGuessOrder,
					detailGuessLabel: toGuessLabel(detailGuessOrder),
					detailCorrectAnswer,
					detailLocked: !!detailLockInfo?.locked,
					detailLockedAt: detailLockInfo?.lockedAt ?? null,
					submitterPoints,
					detailPoints,
					multiplierBonus,
					totalPoints,
					themeGuess: rd?.themeGuesses?.[player.name] ?? null,
				};
			}),
		}));

	return {
		code: room.code,
		phase: room.phase ?? null,
		resultsFinalized: room.phase === "ENDED" && !!game.finalScores,
		activeSongId,
		activeSongIndex: activeSongIndex >= 0 ? activeSongIndex + 1 : null,
		currentSongTitle: currentSong?.title ?? null,
		hasDetailLane,
		detailQuestion: room.detailQuestion ?? null,
		theme: {
			enabled: !!room.theme,
			value: room.theme ?? null,
			hint: getHint(code) || null,
			revealed: isRevealed(code),
			solvedBy: Array.from(solved),
			guessedThisRound: Array.from(guessedThisRound),
			guessesThisRound: themeGuessesThisRound,
		},
		players: room.players.map((player) => ({
			id: player.id,
			name: player.name,
			isHost: !!player.isHost,
			ready: !!player.ready,
			hardcore: !!player.hardcore,
			connected: player.connected !== false,
			avatar: player.avatar,
		})),
		currentSongRows,
		playerHistories,
		updatedAt: Date.now(),
	};
}

function isHostSocketForCode(roomCode: string, socketLike: { data: SocketData }) {
	const room = getRoom(roomCode);
	const meta = socketLike.data.roomMeta;
	if (!room || !meta) return false;
	if (meta.code !== roomCode) return false;
	const member = room.players.find((player) => player.name === meta.playerName);
	return !!member?.isHost;
}

export async function emitAdminDashboardToHosts(
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	code: string,
) {
	const dashboard = buildAdminDashboard(code);
	if (!dashboard) return;

	const sockets = await io.in(code).fetchSockets();
	for (const s of sockets) {
		if (!isHostSocketForCode(code, s)) continue;
		s.emit("ADMIN_DASHBOARD", { dashboard });
	}
}
