// src/lib/game.ts
type RoundData = {
	correctAnswer: string;
	orders: Record<string, string[]>;
	submitters: string[];
};

// In-memory map: roomCode → its active round
const rounds: Record<string, Record<number, RoundData>> = {};

/**
 * Call this when a new round starts.
 * @param code   Room code
 * @param songId ID of the song being guessed
 * @param correctAnswer The exact answer to check guesses against
 */
export function startRoundData(
	code: string,
	songId: number,
	correctAnswer: string,
	submitters: string[] // <<< new
) {
	if (!rounds[code]) rounds[code] = {};
	rounds[code][songId] = {
		correctAnswer,
		orders: {},
		submitters, // <<< stash the list here
	};
}

/** Store a single guess for the active round in a room */
export function storeOrder(code: string, songId: number, playerName: string, order: string[]) {
	rounds[code][songId].orders[playerName] = order;
}

/** Retrieve all guesses for the active round */
export function getAllOrders(code: string, songId: number): Record<string, string[]> {
	return rounds[code][songId].orders;
}

/** Get the correct answer for the active round */
export function lookupCorrectAnswer(code: string, songId: number): string {
	return rounds[code][songId].correctAnswer;
}

/**
 * Tally a simple score: exact (case-insensitive) match → 1 point, else 0
 * Returns a mapping playerName → points for this round
 */
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

export const activeRounds = rounds;
