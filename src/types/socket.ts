import type { AvatarConfig } from "@/types/avatar";
import type { Member } from "@/types/member";
import type { Room, RoomScoring } from "@/types/room";
import type { Submission } from "@/types/submission";

export type SocketRoomMeta = { code: string; playerName: string };
export type SocketAdminMeta = { code: string; clientId: string };

export interface SocketData {
	roomMeta?: SocketRoomMeta;
	adminMeta?: SocketAdminMeta;
}

export type CreateRoomPayload = {
	theme?: string;
	backgroundUrl?: string | null;
	hostName: string;
	avatar?: AvatarConfig;
};

export type CreateRoomResponse = {
	code: string;
	theme?: string | null;
	backgroundUrl?: string;
	hostName: string;
	adminToken?: string;
	hostToken?: string;
	error?: string;
};

export type JoinRoomPayload = {
	code: string;
	name: string;
	hardcore?: boolean;
	clientId?: string;
	hostToken?: string;
	avatar?: AvatarConfig;
};
export type JoinAdminRoomPayload = {
	code: string;
	adminToken: string;
	clientId?: string;
};
export type JoinAdminRoomResponse =
	| { ok: true }
	| { ok: false; reason: "not_found" | "unauthorized" | "error" };

export type AddSongPayload = {
	code: string;
	url: string;
	submitter: string;
	title: string;
	detailAnswer?: string;
};
export type UpdateSongPayload = AddSongPayload & {
	songId: number;
};

export type RemoveSongPayload = { code: string; songId: number };
export type StartGamePayload = { code: string };
export type PlaySongPayload = { code: string; songId: number };
export type NextSongPayload = { code: string };
export type ShowResultsPayload = { code: string };
export type FinalizeResultsPayload = { code: string };
export type BeginRecapPayload = { code: string };
export type GetSongGuessStatsPayload = { code: string };
export type SongGuessStats = {
	songId: number;
	totalPlayers: number;
	guessedCount: number;
	correctGuessers: string[];
	guessers: Array<{
		playerName: string;
		guess: string;
		themeGuess: string | null;
		themeCorrect: boolean | null;
		correct: boolean;
		lockedAt: number | null;
		lockOrder: number | null;
		fastestCorrectLock: boolean;
	}>;
	wrongCount: number;
	noAnswerCount: number;
	commonWrongGuesses: Array<{ guess: string; count: number }>;
};
export type GetSongGuessStatsResponse =
	| { ok: true; stats: SongGuessStats[] }
	| { ok: false; error: "NOT_AUTHORIZED" | "ROOM_NOT_FOUND" | "BAD_REQUEST" };

export type SelectOrderPayload = {
	code: string;
	songId: number;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
	order: string[];
};
export type SelectDetailOrderPayload = {
	code: string;
	songId: number;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
	order: string[];
};

export type SubmitAllOrdersPayload = {
	code: string;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
	guesses: Record<string, string[]>;
};

export type LockAnswerPayload = {
	code: string;
	songId: number;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
};
export type LockDetailPayload = {
	code: string;
	songId: number;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
};
export type ThemeEditPayload = { code: string; theme: string };
export type DetailQuestionPayload = { code: string; question: string };
export type ThemeGuessPayload = {
	code: string;
	// Legacy field kept for client compatibility; server resolves the acting player from socket roomMeta.
	playerName: string;
	guess: string;
};
export type ThemeRevealPayload = { code: string };
export type HardcoreRequiredPayload = { code: string; required: boolean };
export type ScoreRulesPayload = { code: string } & RoomScoring;
export type FinalTieBreakerStats = Record<string, { fastestCorrectLocks: number }>;
export type PlayerHardcorePayload = { code: string; hardcore: boolean };
export type PlayerReadyPayload = { code: string; ready: boolean };
export type RevealedSongsPayload = { code: string; revealed: number[] };
export type RevealSubmitterPayload = { code: string; songId: number };
export type RevealSubmitterAllPayload = { code: string };
export type DevSeedPayload = { code: string; players?: number; songs?: number; ready?: boolean };
export type DevResyncPayload = { code: string };
export type KickPlayerPayload = { code: string; playerName: string };
export type DebugSnapshotPayload = { code: string };
export type AdminDashboardPayload = {
	code: string;
	phase: Room["phase"] | null;
	resultsFinalized: boolean;
	activeSongId: number | null;
	activeSongIndex: number | null;
	currentSongTitle: string | null;
	hasDetailLane: boolean;
	detailQuestion: string | null;
	theme: {
		enabled: boolean;
		value: string | null;
		hint: string | null;
		revealed: boolean;
		solvedBy: string[];
		guessedThisRound: string[];
		guessesThisRound: Record<string, string>;
	};
	players: Array<{
		id: number;
		name: string;
		isHost: boolean;
		ready: boolean;
		hardcore: boolean;
		connected: boolean;
		avatar?: AvatarConfig;
	}>;
	currentSongRows: Array<{
		playerName: string;
		totalScore: number;
		guessOrder: string[];
		guessLabel: string;
		locked: boolean;
		lockedAt: number | null;
		fastestCorrectLock: boolean;
		detailOrder: string[];
		detailLabel: string;
		detailLocked: boolean;
		detailLockedAt: number | null;
		themeSolved: boolean;
		themeGuessedThisRound: boolean;
		themeSolvedRank: number | null;
		themeGuess: string | null;
	}>;
	playerHistories: Array<{
		playerName: string;
		themeBonusPoints: number;
		rounds: Array<{
			songId: number;
			songIndex: number;
			songTitle: string;
			guessOrder: string[];
			guessLabel: string;
			correctAnswer: string;
			locked: boolean;
			lockedAt: number | null;
			fastestCorrectLock: boolean;
			detailGuessOrder: string[];
			detailGuessLabel: string;
			detailCorrectAnswer: string | null;
			detailLocked: boolean;
			detailLockedAt: number | null;
			submitterPoints: number;
			detailPoints: number;
			multiplierBonus: number;
			totalPoints: number;
			themeGuess: string | null;
		}>;
	}>;
	updatedAt: number;
};
export type AdminGetDashboardPayload = { code: string };
export type AdminGetDashboardResponse =
	| { ok: true; dashboard: AdminDashboardPayload }
	| { ok: false; error: "NOT_AUTHORIZED" | "ROOM_NOT_FOUND" | "BAD_REQUEST" };

export type ClientToServerEvents = {
	createRoom: (data: CreateRoomPayload, cb: (resp: CreateRoomResponse) => void) => void;
	joinRoom: (data: JoinRoomPayload, cb?: (ok: boolean) => void) => void;
	joinAdminRoom: (data: JoinAdminRoomPayload, cb: (res: JoinAdminRoomResponse) => void) => void;
	addSong: (
		data: AddSongPayload,
		cb: (res: { success: boolean; song?: Submission; error?: string }) => void,
	) => void;
	updateSong: (
		data: UpdateSongPayload,
		cb: (res: { success: boolean; song?: Submission; error?: string }) => void,
	) => void;
	removeSong: (data: RemoveSongPayload, cb: (res: { success: boolean; error?: string }) => void) => void;
	startGame: (data: StartGamePayload, cb: (ok: boolean) => void) => void;
	playSong: (data: PlaySongPayload, cb: (res: { success: boolean; error?: string }) => void) => void;
	nextSong: (data: NextSongPayload, cb?: (ok: boolean) => void) => void;
	beginRecap: (data: BeginRecapPayload, cb?: (ok: boolean) => void) => void;
	showResults: (data: ShowResultsPayload, cb: (ok: boolean) => void) => void;
	finalizeResults: (data: FinalizeResultsPayload, cb?: (ok: boolean) => void) => void;
	getSongGuessStats: (
		data: GetSongGuessStatsPayload,
		cb: (res: GetSongGuessStatsResponse) => void,
	) => void;
	selectOrder: (data: SelectOrderPayload, cb?: (ok: boolean) => void) => void;
	selectDetailOrder: (data: SelectDetailOrderPayload, cb?: (ok: boolean) => void) => void;
	submitAllOrders: (data: SubmitAllOrdersPayload, cb: (ok: boolean) => void) => void;
	lockAnswer: (data: LockAnswerPayload, cb?: (ok: boolean) => void) => void;
	undoLock: (data: LockAnswerPayload, cb?: (ok: boolean) => void) => void;
	lockDetailAnswer: (data: LockDetailPayload, cb?: (ok: boolean) => void) => void;
	undoDetailLock: (data: LockDetailPayload, cb?: (ok: boolean) => void) => void;
	THEME_EDIT: (data: ThemeEditPayload) => void;
	DETAIL_QUESTION: (data: DetailQuestionPayload) => void;
	THEME_GUESS: (data: ThemeGuessPayload) => void;
	THEME_REVEAL: (data: ThemeRevealPayload) => void;
	HARDCORE_REQUIRED: (data: HardcoreRequiredPayload, cb?: (ok: boolean) => void) => void;
	SCORE_RULES: (data: ScoreRulesPayload, cb?: (ok: boolean) => void) => void;
	PLAYER_HARDCORE: (data: PlayerHardcorePayload, cb?: (ok: boolean) => void) => void;
	PLAYER_READY: (data: PlayerReadyPayload, cb?: (ok: boolean) => void) => void;
	revealedSongs: (data: RevealedSongsPayload) => void;
	revealSubmitter: (data: RevealSubmitterPayload) => void;
	revealSubmitterAll: (data: RevealSubmitterAllPayload) => void;
	DEV_SEED: (data: DevSeedPayload, cb?: (ok: boolean) => void) => void;
	DEV_RESYNC: (data: DevResyncPayload, cb?: (ok: boolean) => void) => void;
	DEV_SNAPSHOT: (data: DebugSnapshotPayload, cb?: (ok: boolean) => void) => void;
	kickPlayer: (data: KickPlayerPayload, cb?: (ok: boolean) => void) => void;
	ADMIN_GET_DASHBOARD: (
		data: AdminGetDashboardPayload,
		cb: (res: AdminGetDashboardResponse) => void,
	) => void;
};

export type ServerToClientEvents = {
	roomData: (room: Room) => void;
	playerJoined: (player: Member) => void;
	playerLeft: (playerId: number) => void;
	songAdded: (song: Submission) => void;
	songRemoved: (data: { songId: number }) => void;
	gameStarted: (room: Room) => void;
	playSong: (data: { songId: number; clipUrl: string }) => void;
	revealedSongs: (revealed: number[]) => void;
	songChanged: (data: { songId: number | null }) => void;
	lockSnapshot: (data: { songId: number | null; locked: string[] }) => void;
	detailLockSnapshot: (data: { songId: number | null; locked: string[] }) => void;
	playerGuessLocked: (data: {
		songId: number;
		playerName: string;
		counts: { locked: number; total: number };
	}) => void;
	playerGuessUndo: (data: {
		songId: number;
		playerName: string;
		counts: { locked: number; total: number };
	}) => void;
	songFinalized: (data: {
		songId: number;
		mode: "hardcoreOnly" | "snapshot";
		counts: { locked: number; total: number };
		lockedNames: string[];
	}) => void;
	detailFinalized: (data: {
		songId: number;
		mode: "hardcoreOnly" | "snapshot";
		counts: { locked: number; total: number };
		lockedNames: string[];
	}) => void;
	playerSubmitted: (data: { playerName: string }) => void;
	gameOver: (data: {
		scores: Record<string, number>;
		tieBreaker?: RoomScoring["tieBreaker"];
		tieBreakerStats?: FinalTieBreakerStats;
	}) => void;
	scoreUpdated: (data: { playerName: string; total: number }) => void;
	THEME_UPDATED: (data: { theme?: string }) => void;
	THEME_SOLVED: (data: { playerName: string }) => void;
	THEME_ROUND_RESET: () => void;
	THEME_GUESS_RESULT: (data: {
		playerName: string;
		correct: boolean;
		reason?: "revealed" | "roundLocked";
		lockedForRound?: boolean;
		alreadySolved?: boolean;
	}) => void;
	THEME_HINT_READY: (data: { obfuscated: string }) => void;
	THEME_REVEALED: () => void;
	THEME_GUESSED_THIS_ROUND: (data: { playerName: string; guess?: string; lockedForRound?: boolean }) => void;
	HARDCORE_REQUIRED_UPDATED: (data: { required: boolean }) => void;
	submitterRevealed: (data: { songId: number }) => void;
	submitterRevealedAll: (data: { songIds: number[] }) => void;
	joinDenied: (data: { reason: "kicked" | "closed" | "not_found" | "name_taken" | "unauthorized" | "error" }) => void;
	ADMIN_DASHBOARD: (data: { dashboard: AdminDashboardPayload }) => void;
	revealedSubmitters: (songIds: number[]) => void;
};

export type InterServerEvents = Record<string, never>;
