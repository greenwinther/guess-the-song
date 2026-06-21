export type RankedScoreRow = {
	name: string;
	rank: number;
	score: number;
	tieBreakerValue?: number;
	decidedByTieBreaker?: boolean;
};

export type ScorePodiumGroup = {
	rank: number;
	score: number;
	names: string[];
	tieBreakerValue?: number;
	decidedByTieBreaker?: boolean;
};

export type ScoreRankingOptions = {
	tieBreaker?: "none" | "fastestCorrectLocks";
	tieBreakerStats?: Record<string, { fastestCorrectLocks: number }>;
};

export function placeLabel(rank: number) {
	if (rank === 1) return "1st place";
	if (rank === 2) return "2nd place";
	if (rank === 3) return "3rd place";
	return `${rank}th place`;
}

export function buildDenseScoreRanking(
	scores: Record<string, number>,
	options: ScoreRankingOptions = {}
): {
	rows: RankedScoreRow[];
	groups: ScorePodiumGroup[];
	podiumGroups: ScorePodiumGroup[];
	revealGroups: ScorePodiumGroup[];
} {
	const tieBreaker = options.tieBreaker ?? "none";
	const getTieBreakerValue = (name: string) =>
		tieBreaker === "fastestCorrectLocks"
			? options.tieBreakerStats?.[name]?.fastestCorrectLocks ?? 0
			: 0;
	const entries = Object.entries(scores).sort(
		([nameA, scoreA], [nameB, scoreB]) =>
			scoreB - scoreA ||
			(tieBreaker === "fastestCorrectLocks"
				? getTieBreakerValue(nameB) - getTieBreakerValue(nameA)
				: 0) ||
			nameA.localeCompare(nameB),
	);
	const rows: RankedScoreRow[] = [];
	const groups: ScorePodiumGroup[] = [];

	for (const [name, score] of entries) {
		const tieBreakerValue = getTieBreakerValue(name);
		let group = groups[groups.length - 1];
		if (
			!group ||
			group.score !== score ||
			(tieBreaker === "fastestCorrectLocks" && group.tieBreakerValue !== tieBreakerValue)
		) {
			const previousSameScore = groups.some((existing) => existing.score === score);
			group = {
				rank: groups.length + 1,
				score,
				names: [],
				tieBreakerValue,
				decidedByTieBreaker: tieBreaker === "fastestCorrectLocks" && previousSameScore,
			};
			groups.push(group);
		}
		group.names.push(name);
		rows.push({
			name,
			rank: group.rank,
			score,
			tieBreakerValue,
			decidedByTieBreaker: group.decidedByTieBreaker,
		});
	}

	if (tieBreaker === "fastestCorrectLocks") {
		const scoreCounts = new Map<number, number>();
		for (const group of groups) {
			scoreCounts.set(group.score, (scoreCounts.get(group.score) ?? 0) + 1);
		}
		for (const group of groups) {
			group.decidedByTieBreaker = (scoreCounts.get(group.score) ?? 0) > 1;
		}
		for (const row of rows) {
			row.decidedByTieBreaker = groups.find((group) => group.rank === row.rank)?.decidedByTieBreaker;
		}
	}

	const podiumGroups = groups.slice(0, 3);
	const revealGroups = [...podiumGroups].reverse();
	return { rows, groups, podiumGroups, revealGroups };
}
