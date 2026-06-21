export type RankedScoreRow = {
	name: string;
	rank: number;
	score: number;
};

export type ScorePodiumGroup = {
	rank: number;
	score: number;
	names: string[];
};

export function placeLabel(rank: number) {
	if (rank === 1) return "1st place";
	if (rank === 2) return "2nd place";
	if (rank === 3) return "3rd place";
	return `${rank}th place`;
}

export function buildDenseScoreRanking(scores: Record<string, number>): {
	rows: RankedScoreRow[];
	groups: ScorePodiumGroup[];
	podiumGroups: ScorePodiumGroup[];
	revealGroups: ScorePodiumGroup[];
} {
	const entries = Object.entries(scores).sort(
		([nameA, scoreA], [nameB, scoreB]) => scoreB - scoreA || nameA.localeCompare(nameB),
	);
	const rows: RankedScoreRow[] = [];
	const groups: ScorePodiumGroup[] = [];

	for (const [name, score] of entries) {
		let group = groups[groups.length - 1];
		if (!group || group.score !== score) {
			group = { rank: groups.length + 1, score, names: [] };
			groups.push(group);
		}
		group.names.push(name);
		rows.push({ name, rank: group.rank, score });
	}

	const podiumGroups = groups.slice(0, 3);
	const revealGroups = [...podiumGroups].reverse();
	return { rows, groups, podiumGroups, revealGroups };
}
