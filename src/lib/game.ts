// src/lib/game.ts
import { notifyStateChange } from "@/server/state/saveBus";
type LockInfo = {
	locked: boolean;
	lockedAt?: number;
	method?: "manual" | "auto"; // optional analytics
};

export type RoundData = {
	correctAnswer: string;
	orders: Record<string, string[]>; // you already have this
	submitters: string[]; // you already have this
	locks: Record<string, LockInfo>; // 👈 NEW per player
	detailCorrectAnswer?: string;
	detailAnswers?: string[];
	detailOrders?: Record<string, string[]>;
	detailLocks?: Record<string, LockInfo>;
};

const HARDCORE_UNDO_MS = 2000;

// In-memory map: roomCode → songId → RoundData
const rounds: Record<string, Record<number, RoundData>> = {};
export const activeRounds = rounds;

export function getRoundsForCode(code: string): Record<number, RoundData> {
	return rounds[code] ?? {};
}

// --- Setup ---
export function startRoundData(
	code: string,
	songId: number,
	correctAnswer: string,
	submitters: string[],
	detail?: { correctAnswer: string; answers: string[] }
) {
	if (!rounds[code]) rounds[code] = {};
	rounds[code][songId] = {
		correctAnswer,
		orders: {},
		submitters,
		locks: {}, // 👈 init
		detailCorrectAnswer: detail?.correctAnswer,
		detailAnswers: detail?.answers,
		detailOrders: detail ? {} : undefined,
		detailLocks: detail ? {} : undefined,
	};
	notifyStateChange();
}

// --- Selection updates (does NOT lock) ---
export function storeOrder(code: string, songId: number, playerName: string, order: string[]) {
	const rd = rounds[code]?.[songId];
	if (!rd) return;
	const li = rd.locks[playerName];
	if (li?.locked) return; // ignore edits after lock
	rd.orders[playerName] = order;
	notifyStateChange();
}

export function storeDetailOrder(code: string, songId: number, playerName: string, order: string[]) {
	const rd = rounds[code]?.[songId];
	if (!rd || !rd.detailOrders || !rd.detailLocks) return;
	const li = rd.detailLocks[playerName];
	if (li?.locked) return;
	rd.detailOrders[playerName] = order;
	notifyStateChange();
}

// --- Manual lock (from "Lock answer" button) ---
export function manualLock(code: string, songId: number, playerName: string): boolean {
	const rd = rounds[code]?.[songId];
	if (!rd) return false;

	const li = rd.locks[playerName] ?? { locked: false };
	if (li.locked) return false;

	// Ensure at least an order exists; if not, count as "no answer"
	rd.orders[playerName] = rd.orders[playerName] ?? [];

	rd.locks[playerName] = {
		locked: true,
		lockedAt: Date.now(),
		method: "manual",
	};
	notifyStateChange();
	return true;
}

// --- Optional tiny undo window (2s) for manual locks ---
export function tryUndoManualLock(code: string, songId: number, playerName: string): boolean {
	const rd = rounds[code]?.[songId];
	if (!rd) return false;

	const li = rd.locks[playerName];
	if (!li?.locked || li.method !== "manual" || !li.lockedAt) return false;

	if (Date.now() - li.lockedAt > HARDCORE_UNDO_MS) return false;

	// Just revert the lock; keep the order intact so the player can tweak again
	rd.locks[playerName] = { locked: false };
	notifyStateChange();
	return true;
}

export function tryUndoDetailLock(code: string, songId: number, playerName: string): boolean {
	const rd = rounds[code]?.[songId];
	if (!rd || !rd.detailLocks) return false;

	const li = rd.detailLocks[playerName];
	if (!li?.locked || li.method !== "manual" || !li.lockedAt) return false;
	if (Date.now() - li.lockedAt > HARDCORE_UNDO_MS) return false;

	rd.detailLocks[playerName] = { locked: false };
	notifyStateChange();
	return true;
}

export function manualDetailLock(code: string, songId: number, playerName: string): boolean {
	const rd = rounds[code]?.[songId];
	if (!rd || !rd.detailOrders || !rd.detailLocks) return false;

	const li = rd.detailLocks[playerName] ?? { locked: false };
	if (li.locked) return false;

	rd.detailOrders[playerName] = rd.detailOrders[playerName] ?? [];
	rd.detailLocks[playerName] = { locked: true, lockedAt: Date.now(), method: "manual" };
	notifyStateChange();
	return true;
}

// --- Helpers to power the host UI counters ---
export function lockCounts(code: string, songId: number): { locked: number; total: number } {
	const rd = rounds[code]?.[songId];
	if (!rd) return { locked: 0, total: 0 };
	const total = new Set([...Object.keys(rd.orders), ...Object.keys(rd.locks)]).size;
	const locked = Object.values(rd.locks).filter((x) => x.locked).length;
	return { locked, total };
}

export function detailLockCounts(code: string, songId: number): { locked: number; total: number } {
	const rd = rounds[code]?.[songId];
	if (!rd || !rd.detailLocks || !rd.detailOrders) return { locked: 0, total: 0 };
	const total = new Set([
		...Object.keys(rd.detailOrders),
		...Object.keys(rd.detailLocks),
	]).size;
	const locked = Object.values(rd.detailLocks).filter((x) => x.locked).length;
	return { locked, total };
}

// lib/game.ts
export function getLockedPlayers(code: string, songId: number): string[] {
	const rd = activeRounds[code]?.[songId];
	if (!rd) return [];
	return Object.entries(rd.locks)
		.filter(([, li]) => li.locked)
		.map(([name]) => name);
}

export function getDetailLockedPlayers(code: string, songId: number): string[] {
	const rd = activeRounds[code]?.[songId];
	if (!rd || !rd.detailLocks) return [];
	return Object.entries(rd.detailLocks)
		.filter(([, li]) => li.locked)
		.map(([name]) => name);
}

// Lock only specific players for a given song (auto lock)
export function finalizeSongForPlayers(code: string, songId: number, playerNames: string[]) {
	const rd = activeRounds[code]?.[songId];
	if (!rd) return { locked: 0, total: playerNames.length };

	let locked = 0;
	for (const name of playerNames) {
		const already = rd.locks?.[name]?.locked;
		if (!already) {
			rd.orders[name] = rd.orders[name] ?? []; // empty = no guess
			rd.locks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
		}
		if (rd.locks[name]?.locked) locked++;
	}
	notifyStateChange();
	return { locked, total: playerNames.length };
}

export function finalizeDetailForPlayers(code: string, songId: number, playerNames: string[]) {
	const rd = activeRounds[code]?.[songId];
	if (!rd || !rd.detailOrders || !rd.detailLocks) return { locked: 0, total: playerNames.length };

	let locked = 0;
	for (const name of playerNames) {
		const already = rd.detailLocks?.[name]?.locked;
		if (!already) {
			rd.detailOrders[name] = rd.detailOrders[name] ?? [];
			rd.detailLocks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
		}
		if (rd.detailLocks[name]?.locked) locked++;
	}
	notifyStateChange();
	return { locked, total: playerNames.length };
}

export function clearRoomRounds(code: string) {
	delete rounds[code];
	notifyStateChange();
}

export function removePlayerFromRounds(code: string, playerName: string) {
	const bySong = rounds[code];
	if (!bySong) return;
	for (const data of Object.values(bySong)) {
		delete data.orders[playerName];
		delete data.locks[playerName];
	}
	notifyStateChange();
}

type PersistedRounds = Record<string, Record<number, RoundData>>;

export function exportRoundsState(): PersistedRounds {
	const snapshot: PersistedRounds = {};
	for (const [code, bySong] of Object.entries(rounds)) {
		snapshot[code] = {};
		for (const [songId, data] of Object.entries(bySong)) {
			const numericId = Number(songId);
			snapshot[code][numericId] = {
				correctAnswer: data.correctAnswer,
				orders: { ...data.orders },
				submitters: [...data.submitters],
				locks: { ...data.locks },
				detailCorrectAnswer: data.detailCorrectAnswer,
				detailAnswers: data.detailAnswers ? [...data.detailAnswers] : undefined,
				detailOrders: data.detailOrders ? { ...data.detailOrders } : undefined,
				detailLocks: data.detailLocks ? { ...data.detailLocks } : undefined,
			};
		}
	}
	return snapshot;
}

export function importRoundsState(snapshot: PersistedRounds | null | undefined) {
	for (const key of Object.keys(rounds)) delete rounds[key];
	if (!snapshot) return;
	for (const [code, bySong] of Object.entries(snapshot)) {
		rounds[code] = {};
		for (const [songId, data] of Object.entries(bySong)) {
			const numericId = Number(songId);
			rounds[code][numericId] = {
				correctAnswer: data.correctAnswer ?? "",
				orders: data.orders ?? {},
				submitters: Array.isArray(data.submitters) ? data.submitters : [],
				locks: data.locks ?? {},
				detailCorrectAnswer: data.detailCorrectAnswer,
				detailAnswers: Array.isArray(data.detailAnswers) ? data.detailAnswers : undefined,
				detailOrders: data.detailOrders ?? undefined,
				detailLocks: data.detailLocks ?? undefined,
			};
		}
	}
}
