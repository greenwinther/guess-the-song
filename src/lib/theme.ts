// Minimal in-memory helpers; keyed by room code (same as lib/game.ts style)

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
}

export function lockPlayerThisRound(code: string, playerName: string) {
	initThemeState(code);
	lockedThisRound[code].add(playerName);
}
export function hasLockedThisRound(code: string, playerName: string) {
	initThemeState(code);
	return lockedThisRound[code].has(playerName);
}
export function clearRoundLocks(code: string) {
	initThemeState(code);
	lockedThisRound[code] = new Set();
}

export function markSolved(code: string, playerName: string) {
	initThemeState(code);
	solvedBy[code].add(playerName);
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
}
export function isRevealed(code: string) {
	initThemeState(code);
	return revealed[code];
}

export function setHint(code: string, value: string) {
	initThemeState(code);
	hint[code] = value;
}
export function getHint(code: string) {
	initThemeState(code);
	return hint[code];
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
