// Minimal in-memory helpers; keyed by room code (same as lib/game.ts style)
import { notifyStateChange } from "@/server/state/saveBus";

const solvedBy: Record<string, Set<string>> = {}; // code -> Set(playerName)
const lockedThisRound: Record<string, Set<string>> = {}; // code -> Set(playerName)
const revealed: Record<string, boolean> = {}; // code -> revealed?
const hint: Record<string, string> = {}; // code -> obfuscated string

export function initThemeState(code: string) {
	if (!solvedBy[code]) solvedBy[code] = new Set();
	if (!lockedThisRound[code]) lockedThisRound[code] = new Set();
	if (revealed[code] === undefined) revealed[code] = false;
	if (hint[code] === undefined) hint[code] = "";
}

export function resetForNewTheme(code: string) {
	solvedBy[code] = new Set();
	lockedThisRound[code] = new Set();
	revealed[code] = false;
	hint[code] = "";
	notifyStateChange();
}

export function lockPlayerThisRound(code: string, playerName: string) {
	initThemeState(code);
	lockedThisRound[code].add(playerName);
	notifyStateChange();
}
export function hasLockedThisRound(code: string, playerName: string) {
	initThemeState(code);
	return lockedThisRound[code].has(playerName);
}
export function clearRoundLocks(code: string) {
	initThemeState(code);
	lockedThisRound[code] = new Set();
	notifyStateChange();
}

export function markSolved(code: string, playerName: string) {
	initThemeState(code);
	solvedBy[code].add(playerName);
	notifyStateChange();
}
export function alreadySolved(code: string, playerName: string) {
	initThemeState(code);
	return solvedBy[code].has(playerName);
}
export function getSolvedList(code: string) {
	initThemeState(code);
	return Array.from(solvedBy[code]);
}

export function setRevealed(code: string, value: boolean) {
	initThemeState(code);
	revealed[code] = value;
	notifyStateChange();
}
export function isRevealed(code: string) {
	initThemeState(code);
	return revealed[code];
}

export function setHint(code: string, value: string) {
	initThemeState(code);
	hint[code] = value;
	notifyStateChange();
}
export function getHint(code: string) {
	initThemeState(code);
	return hint[code];
}

export function clearThemeState(code: string) {
	delete solvedBy[code];
	delete lockedThisRound[code];
	delete revealed[code];
	delete hint[code];
	notifyStateChange();
}

export function removePlayerFromThemeState(code: string, playerName: string) {
	initThemeState(code);
	solvedBy[code].delete(playerName);
	lockedThisRound[code].delete(playerName);
	notifyStateChange();
}

export function getLockedThisRoundList(code: string) {
	initThemeState(code);
	return Array.from(lockedThisRound[code]);
}

type PersistedThemeState = {
	solvedBy: Record<string, string[]>;
	lockedThisRound: Record<string, string[]>;
	revealed: Record<string, boolean>;
	hint: Record<string, string>;
};

export function exportThemeState(): PersistedThemeState {
	const solved: Record<string, string[]> = {};
	const locked: Record<string, string[]> = {};
	const revealedMap: Record<string, boolean> = {};
	const hints: Record<string, string> = {};

	for (const [code, set] of Object.entries(solvedBy)) solved[code] = Array.from(set);
	for (const [code, set] of Object.entries(lockedThisRound)) locked[code] = Array.from(set);
	for (const [code, value] of Object.entries(revealed)) revealedMap[code] = !!value;
	for (const [code, value] of Object.entries(hint)) hints[code] = value ?? "";

	return {
		solvedBy: solved,
		lockedThisRound: locked,
		revealed: revealedMap,
		hint: hints,
	};
}

export function importThemeState(snapshot: PersistedThemeState | null | undefined) {
	for (const key of Object.keys(solvedBy)) delete solvedBy[key];
	for (const key of Object.keys(lockedThisRound)) delete lockedThisRound[key];
	for (const key of Object.keys(revealed)) delete revealed[key];
	for (const key of Object.keys(hint)) delete hint[key];

	if (!snapshot) return;

	for (const [code, list] of Object.entries(snapshot.solvedBy ?? {})) {
		solvedBy[code] = new Set(list ?? []);
	}
	for (const [code, list] of Object.entries(snapshot.lockedThisRound ?? {})) {
		lockedThisRound[code] = new Set(list ?? []);
	}
	for (const [code, value] of Object.entries(snapshot.revealed ?? {})) {
		revealed[code] = !!value;
	}
	for (const [code, value] of Object.entries(snapshot.hint ?? {})) {
		hint[code] = value ?? "";
	}
}

// Utility
export function obfuscateTheme(s: string) {
	return (s ?? "")
		.split(/\s+/)
		.map((w) => (w ? w[0] + "•".repeat(Math.max(0, w.length - 1)) : ""))
		.join(" ");
}

// Normalization for string compare
export function normalize(s: string) {
	return (s ?? "")
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\p{L}\p{N} ]+/gu, "")
		.trim();
}
