export type ScoreRow = {
	playerName: string;
	correctGuesses: number;
	correctDetailGuesses: number;
	themeBonuses: number;
	hardcoreBonus: number;
	fastestCorrectLocks: number;
	total: number;
};

export type ScoreBoard = {
	byPlayer: Record<string, ScoreRow>;
	ranked: ScoreRow[];
};
