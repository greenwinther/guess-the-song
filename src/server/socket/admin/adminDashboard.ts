import type { Server } from "socket.io";
import { getRoundsForCode } from "@/lib/game";
import { getHint, getLockedThisRoundList, getSolvedList, isRevealed } from "@/lib/theme";
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

	const currentSongRows = room.players
		.filter((player) => !player.isHost)
		.map((player) => {
			const lockInfo = activeRound?.locks?.[player.name];
			const detailLockInfo = activeRound?.detailLocks?.[player.name];
			const guessOrder = activeRound?.orders?.[player.name] ?? [];
			const detailOrder = activeRound?.detailOrders?.[player.name] ?? [];
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
			};
		});
	const playerHistories = room.players
		.filter((player) => !player.isHost)
		.map((player) => ({
			playerName: player.name,
			rounds: room.songs.map((song, index) => {
				const rd = rounds[song.id];
				const lockInfo = rd?.locks?.[player.name];
				const detailLockInfo = rd?.detailLocks?.[player.name];
				const guessOrder = rd?.orders?.[player.name] ?? [];
				const detailGuessOrder = rd?.detailOrders?.[player.name] ?? [];
				return {
					songId: song.id,
					songIndex: index + 1,
					songTitle: song.title ?? "",
					guessOrder,
					guessLabel: toGuessLabel(guessOrder),
					correctAnswer: rd?.correctAnswer ?? song.submitter ?? "",
					locked: !!lockInfo?.locked,
					lockedAt: lockInfo?.lockedAt ?? null,
					detailGuessOrder,
					detailGuessLabel: toGuessLabel(detailGuessOrder),
					detailCorrectAnswer: rd?.detailCorrectAnswer ?? song.detailAnswer ?? null,
					detailLocked: !!detailLockInfo?.locked,
					detailLockedAt: detailLockInfo?.lockedAt ?? null,
				};
			}),
		}));

	return {
		code: room.code,
		phase: room.phase ?? null,
		activeSongId,
		activeSongIndex: activeSongIndex >= 0 ? activeSongIndex + 1 : null,
		currentSongTitle: currentSong?.title ?? null,
		hasDetailLane,
		detailQuestion: room.detailQuestion ?? null,
		theme: {
			enabled: !!room.theme,
			hint: getHint(code) || null,
			revealed: isRevealed(code),
			solvedBy: Array.from(solved),
			guessedThisRound: Array.from(guessedThisRound),
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
