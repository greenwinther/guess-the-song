export type ScoreRow = {
	playerName: string;
	correctGuesses: number;
	themeBonuses: number;
	hardcoreBonus: number;
	total: number;
};

export type ScoreBoard = {
	byPlayer: Record<string, ScoreRow>;
	ranked: ScoreRow[];
};
