import type { Server } from "socket.io";
import { getRoundsForCode } from "@/lib/game";
import { getRoomScores } from "@/lib/score";
import {
	getHint,
	getLockedThisRoundList,
	normalize,
	getSolvedList,
	getThemeGuessesThisRound,
	isRevealed,
} from "@/lib/theme";
import {
	computeScoreBoard,
	getFastestCorrectLockPlayerNames,
	isMultiplierEligible,
} from "@/server/logic/score";
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
	if (!order?.length) return "-";
	if (order.length === 1) return order[0] || "-";
	return order.filter(Boolean).join(" > ") || "-";
};

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

	const solvedList = getSolvedList(code);
	const solved = new Set(solvedList);
	const solvedRankByPlayer = new Map(solvedList.map((playerName, index) => [playerName, index + 1]));
	const guessedThisRound = new Set(getLockedThisRoundList(code));
	const themeGuessesThisRound = {
		...getThemeGuessesThisRound(code),
		...(activeRound?.themeGuesses ?? {}),
	};
	const normalizedTheme = normalize(room.theme ?? "");
	const fastestCorrectBySong = new Map(
		Object.entries(rounds).map(([songId, round]) => [
			Number(songId),
			new Set(getFastestCorrectLockPlayerNames(round)),
		])
	);

	const scoreBoard = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: getRoomScores(code),
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
		scoring: room.rules,
	});
	const solvedThemeByPlayer = new Map<string, { guess: string | null }>();
	for (const player of room.players) {
		if (player.isHost) continue;
		let solvedGuess: string | null = null;
		if (normalizedTheme) {
			for (let i = 0; i < room.songs.length; i += 1) {
				const song = room.songs[i];
				const guess = rounds[song.id]?.themeGuesses?.[player.name];
				if (!guess) continue;
				if (normalize(guess) !== normalizedTheme) continue;
				solvedGuess = guess;
				break;
			}
		}
		solvedThemeByPlayer.set(player.name, { guess: solvedGuess });
	}

	const currentSongRows = room.players
		.filter((player) => !player.isHost)
		.map((player) => {
			const lockInfo = activeRound?.locks?.[player.name];
			const detailLockInfo = activeRound?.detailLocks?.[player.name];
			const guessOrder = activeRound?.orders?.[player.name] ?? [];
			const detailOrder = activeRound?.detailOrders?.[player.name] ?? [];
			const roundThemeGuess =
				activeRound?.themeGuesses?.[player.name] ?? themeGuessesThisRound[player.name] ?? null;
			const solvedTheme = solvedThemeByPlayer.get(player.name);
			return {
				playerName: player.name,
				totalScore: scoreBoard.byPlayer[player.name]?.total ?? 0,
				guessOrder,
				guessLabel: toGuessLabel(guessOrder),
				locked: !!lockInfo?.locked,
				lockedAt: lockInfo?.lockedAt ?? null,
				fastestCorrectLock:
					activeSongId != null && !!fastestCorrectBySong.get(activeSongId)?.has(player.name),
				detailOrder,
				detailLabel: toGuessLabel(detailOrder),
				detailLocked: !!detailLockInfo?.locked,
				detailLockedAt: detailLockInfo?.lockedAt ?? null,
				themeSolved: solved.has(player.name),
				themeGuessedThisRound: guessedThisRound.has(player.name),
				themeSolvedRank: solvedRankByPlayer.get(player.name) ?? null,
				themeGuess: solvedTheme?.guess ?? roundThemeGuess,
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
					room.rules.hardcoreRules.enabled && room.rules.hardcoreRules.rewardMode === "multiplier"
						? (submitterCorrect && isMultiplierEligible(lockInfo)
							? room.rules.guessPoints * (room.rules.hardcoreRules.multiplier - 1)
							: 0) +
							(detailCorrect && isMultiplierEligible(detailLockInfo)
								? room.rules.detailGuessPoints * (room.rules.hardcoreRules.multiplier - 1)
								: 0)
						: 0;
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
					fastestCorrectLock: !!fastestCorrectBySong.get(song.id)?.has(player.name),
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

