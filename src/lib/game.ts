// src/lib/game.ts
type LockInfo = {
	locked: boolean;
	lockedAt?: number;
	method?: "manual" | "auto"; // optional analytics
};

type RoundData = {
	correctAnswer: string;
	orders: Record<string, string[]>; // you already have this
	submitters: string[]; // you already have this
	locks: Record<string, LockInfo>; // 👈 NEW per player
};

const HARDCORE_UNDO_MS = 2000;

// In-memory map: roomCode → songId → RoundData
const rounds: Record<string, Record<number, RoundData>> = {};
export const activeRounds = rounds;

// --- Setup ---
export function startRoundData(code: string, songId: number, correctAnswer: string, submitters: string[]) {
	if (!rounds[code]) rounds[code] = {};
	rounds[code][songId] = {
		correctAnswer,
		orders: {},
		submitters,
		locks: {}, // 👈 init
	};
}

// --- Selection updates (does NOT lock) ---
export function storeOrder(code: string, songId: number, playerName: string, order: string[]) {
	const rd = rounds[code]?.[songId];
	if (!rd) return;
	const li = rd.locks[playerName];
	if (li?.locked) return; // ignore edits after lock
	rd.orders[playerName] = order;
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
	return true;
}

// --- Auto-finalize (called on host "Next song") ---
export function finalizeSongForAll(code: string, songId: number) {
	const rd = rounds[code]?.[songId];
	if (!rd) return { locked: 0, total: 0 };

	let locked = 0;
	const playerNames = new Set([...Object.keys(rd.orders), ...Object.keys(rd.locks)]);

	for (const name of playerNames) {
		const li = rd.locks[name] ?? { locked: false };
		if (!li.locked) {
			// Lock whatever selection exists now (or [] = "no answer")
			rd.orders[name] = rd.orders[name] ?? [];
			rd.locks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
		}
		if (rd.locks[name].locked) locked++;
	}

	return { locked, total: playerNames.size };
}

// --- Helpers to power the host UI counters ---
export function lockCounts(code: string, songId: number): { locked: number; total: number } {
	const rd = rounds[code]?.[songId];
	if (!rd) return { locked: 0, total: 0 };
	const total = new Set([...Object.keys(rd.orders), ...Object.keys(rd.locks)]).size;
	const locked = Object.values(rd.locks).filter((x) => x.locked).length;
	return { locked, total };
}

// --- Your existing scoring stays identical ---
export function computeScores(
	allOrders: Record<string, string[]>,
	correctAnswer: string
): Record<string, number> {
	const scores: Record<string, number> = {};
	for (const [player, order] of Object.entries(allOrders)) {
		scores[player] = order[0] === correctAnswer ? 1 : 0;
	}
	return scores;
}
