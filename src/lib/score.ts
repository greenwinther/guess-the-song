// Minimal in-memory scoreboard keyed by room code + player name.
// If you later move scores to DB, keep the same function signature.

const scoresByCode: Record<string, Record<string, number>> = {};

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

export function clearRoomScores(code: string) {
	delete scoresByCode[code];
}

export function removePlayerScore(code: string, playerName: string) {
	if (!scoresByCode[code]) return;
	delete scoresByCode[code][playerName];
}
