// Minimal in-memory scoreboard keyed by room code + player name.
// If you later move scores to DB, keep the same function signature.

const scoresByCode: Record<string, Record<string, number>> = {};

export function getScore(code: string, playerName: string): number {
	return scoresByCode[code]?.[playerName] ?? 0;
}

export function addPointsByCodeName(code: string, playerName: string, delta: number): number {
	if (!scoresByCode[code]) scoresByCode[code] = {};
	const prev = scoresByCode[code][playerName] ?? 0;
	const next = prev + delta;
	scoresByCode[code][playerName] = next;
	return next;
}

// Optional: get whole board for a room if you need it elsewhere
export function getRoomScores(code: string): Record<string, number> {
	return scoresByCode[code] ?? {};
}
