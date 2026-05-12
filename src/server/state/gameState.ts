import { notifyStateChange } from "./saveBus";

type RoomCode = string;

type RoomGameState = {
	activeSongId: number | null;
	revealedSongs: number[];
	revealedSubmitters: number[];
	finalScores: Record<string, number> | null;
	gameStarted: boolean;
};

const byRoom = new Map<RoomCode, RoomGameState>();

const defaultState = (): RoomGameState => ({
	activeSongId: null,
	revealedSongs: [],
	revealedSubmitters: [],
	finalScores: null,
	gameStarted: false,
});

export function getRoomGameState(code: RoomCode): RoomGameState {
	const key = code.toUpperCase();
	const existing = byRoom.get(key);
	if (existing) return existing;
	const created = defaultState();
	byRoom.set(key, created);
	return created;
}

export function setActiveSong(code: RoomCode, songId: number | null) {
	const s = getRoomGameState(code);
	s.activeSongId = songId;
	notifyStateChange();
	return s;
}

export function setRevealedSongs(code: RoomCode, ids: number[]) {
	const s = getRoomGameState(code);
	s.revealedSongs = ids;
	notifyStateChange();
	return s;
}

export function addRevealedSong(code: RoomCode, songId: number) {
	const s = getRoomGameState(code);
	if (!s.revealedSongs.includes(songId)) s.revealedSongs.push(songId);
	notifyStateChange();
	return s;
}

export function setRevealedSubmitters(code: RoomCode, ids: number[]) {
	const s = getRoomGameState(code);
	s.revealedSubmitters = ids;
	notifyStateChange();
	return s;
}

export function addRevealedSubmitter(code: RoomCode, songId: number) {
	const s = getRoomGameState(code);
	if (!s.revealedSubmitters.includes(songId)) s.revealedSubmitters.push(songId);
	notifyStateChange();
	return s;
}

export function isSubmitterRevealed(code: RoomCode, songId: number): boolean {
	return getRoomGameState(code).revealedSubmitters.includes(songId);
}

export function setFinalScores(code: RoomCode, scores: Record<string, number> | null) {
	const s = getRoomGameState(code);
	s.finalScores = scores;
	notifyStateChange();
	return s;
}

export function setGameStarted(code: RoomCode, started: boolean) {
	const s = getRoomGameState(code);
	s.gameStarted = started;
	notifyStateChange();
	return s;
}

export function clearRoomGameState(code: RoomCode) {
	byRoom.delete(code.toUpperCase());
	notifyStateChange();
}

export function exportGameState(): Record<string, RoomGameState> {
	const snapshot: Record<string, RoomGameState> = {};
	for (const [code, state] of byRoom.entries()) {
		snapshot[code] = {
			activeSongId: state.activeSongId,
			revealedSongs: [...state.revealedSongs],
			revealedSubmitters: [...state.revealedSubmitters],
			finalScores: state.finalScores ? { ...state.finalScores } : null,
			gameStarted: state.gameStarted,
		};
	}
	return snapshot;
}

export function importGameState(snapshot: Record<string, RoomGameState> | null | undefined) {
	byRoom.clear();
	if (!snapshot) return;
	for (const [code, state] of Object.entries(snapshot)) {
		byRoom.set(code.toUpperCase(), {
			activeSongId: state.activeSongId ?? null,
			revealedSongs: Array.isArray(state.revealedSongs) ? [...state.revealedSongs] : [],
			revealedSubmitters: Array.isArray(state.revealedSubmitters) ? [...state.revealedSubmitters] : [],
			finalScores: state.finalScores ? { ...state.finalScores } : null,
			gameStarted: !!state.gameStarted,
		});
	}
}
