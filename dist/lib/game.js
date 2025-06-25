// In-memory map: roomCode → its active round
const rounds = {};
/**
 * Call this when a new round starts.
 * @param code   Room code
 * @param songId ID of the song being guessed
 * @param correctAnswer The exact answer to check guesses against
 */
export function startRoundData(code, songId, correctAnswer, submitters // <<< new
) {
    if (!rounds[code])
        rounds[code] = {};
    rounds[code][songId] = {
        correctAnswer,
        orders: {},
        submitters, // <<< stash the list here
    };
}
/** Store a single guess for the active round in a room */
export function storeOrder(code, songId, playerName, order) {
    rounds[code][songId].orders[playerName] = order;
}
/** Retrieve all guesses for the active round */
export function getAllOrders(code, songId) {
    return rounds[code][songId].orders;
}
/** Get the correct answer for the active round */
export function lookupCorrectAnswer(code, songId) {
    return rounds[code][songId].correctAnswer;
}
/**
 * Tally a simple score: exact (case-insensitive) match → 1 point, else 0
 * Returns a mapping playerName → points for this round
 */
export function computeScores(allOrders, correctAnswer) {
    const scores = {};
    for (const [player, order] of Object.entries(allOrders)) {
        scores[player] = order[0] === correctAnswer ? 1 : 0;
    }
    return scores;
}
export const activeRounds = rounds;
