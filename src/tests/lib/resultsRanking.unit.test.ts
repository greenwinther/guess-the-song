import assert from "node:assert/strict";
import test from "node:test";
import { buildDenseScoreRanking, placeLabel } from "@/lib/resultsRanking";

const groupSummary = (scores: Record<string, number>) =>
	buildDenseScoreRanking(scores).podiumGroups.map((group) => ({
		rank: group.rank,
		score: group.score,
		names: group.names,
	}));

test("buildDenseScoreRanking creates podium groups with no ties", () => {
	assert.deepEqual(groupSummary({ Alice: 10, Bob: 8, Casey: 6 }), [
		{ rank: 1, score: 10, names: ["Alice"] },
		{ rank: 2, score: 8, names: ["Bob"] },
		{ rank: 3, score: 6, names: ["Casey"] },
	]);
});

test("buildDenseScoreRanking keeps a tie for first on the same podium", () => {
	assert.deepEqual(groupSummary({ Alice: 10, Bob: 10, Casey: 8, Drew: 6 }), [
		{ rank: 1, score: 10, names: ["Alice", "Bob"] },
		{ rank: 2, score: 8, names: ["Casey"] },
		{ rank: 3, score: 6, names: ["Drew"] },
	]);
});

test("buildDenseScoreRanking keeps a tie for second on the same podium", () => {
	assert.deepEqual(groupSummary({ Alice: 10, Bob: 8, Casey: 8, Drew: 6 }), [
		{ rank: 1, score: 10, names: ["Alice"] },
		{ rank: 2, score: 8, names: ["Bob", "Casey"] },
		{ rank: 3, score: 6, names: ["Drew"] },
	]);
});

test("buildDenseScoreRanking reveals only existing groups when first place has three players", () => {
	assert.deepEqual(groupSummary({ Alice: 10, Bob: 10, Casey: 10, Drew: 8 }), [
		{ rank: 1, score: 10, names: ["Alice", "Bob", "Casey"] },
		{ rank: 2, score: 8, names: ["Drew"] },
	]);
});

test("buildDenseScoreRanking limits podium reveal to the top three score groups", () => {
	const ranking = buildDenseScoreRanking({ Alice: 10, Bob: 9, Casey: 8, Drew: 7 });

	assert.deepEqual(
		ranking.podiumGroups.map((group) => group.rank),
		[1, 2, 3],
	);
	assert.equal(ranking.podiumGroups.some((group) => group.rank === 4), false);
});

test("buildDenseScoreRanking reveal labels go from third to first when all groups exist", () => {
	const labels = buildDenseScoreRanking({ Alice: 10, Bob: 8, Casey: 6 }).revealGroups.map((group) =>
		placeLabel(group.rank),
	);

	assert.deepEqual(labels, ["3rd place", "2nd place", "1st place"]);
});
