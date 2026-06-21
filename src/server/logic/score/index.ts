import { DEFAULT_ROOM_SCORING, type Room, type RoomScoring } from "@/types/room";
import type { RoundData } from "@/lib/game";
import type { ScoreBoard, ScoreRow } from "./types";

type ScoreInputs = {
	room: Room;
	rounds: Record<number, RoundData>;
	themePointsByPlayer: Record<string, number>;
	guessPoints?: number;
	detailGuessPoints?: number;
	themeGuessPoints?: number;
	hardcoreMultiplier?: number;
	scoring?: RoomScoring;
};

type LockInfoLike = {
	locked?: boolean;
	lockedAt?: number;
	multiplierEligible?: boolean;
	hardcoreEligible?: boolean;
};

export function isMultiplierEligible(lock: LockInfoLike | undefined) {
	return lock?.multiplierEligible ?? lock?.hardcoreEligible ?? false;
}

export function getFastestCorrectLockPlayerNames(round: RoundData): string[] {
	const correctLocks = Object.entries(round.orders)
		.filter(([, order]) => order[0] === round.correctAnswer)
		.map(([playerName]) => ({
			playerName,
			locked: round.locks?.[playerName]?.locked,
			lockedAt: round.locks?.[playerName]?.lockedAt,
		}))
		.filter(
			(item): item is { playerName: string; locked: true; lockedAt: number } =>
				item.locked === true && Number.isFinite(item.lockedAt)
		);
	if (correctLocks.length === 0) return [];

	const fastestAt = Math.min(...correctLocks.map((item) => item.lockedAt));
	return correctLocks
		.filter((item) => item.lockedAt === fastestAt)
		.map((item) => item.playerName)
		.sort((a, b) => a.localeCompare(b));
}

export function countFastestCorrectLocks(rounds: Record<number, RoundData>): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const round of Object.values(rounds)) {
		for (const playerName of getFastestCorrectLockPlayerNames(round)) {
			counts[playerName] = (counts[playerName] ?? 0) + 1;
		}
	}
	return counts;
}

export function computeScoreBoard({
	room,
	rounds,
	themePointsByPlayer,
	guessPoints = 1,
	detailGuessPoints = 1,
	themeGuessPoints = 1,
	hardcoreMultiplier = 1.5,
	scoring,
}: ScoreInputs): ScoreBoard {
	const byPlayer: Record<string, ScoreRow> = {};
	const scoringPlayers = room.players.filter((player) => !player.isHost);
	const scoringNames = new Set(scoringPlayers.map((player) => player.name));
	const effectiveScoring: RoomScoring = {
		...DEFAULT_ROOM_SCORING,
		...room.scoring,
		...scoring,
		guessPoints,
		detailGuessPoints,
		themeGuessPoints,
		hardcoreMultiplier,
		hardcoreRules: {
			...DEFAULT_ROOM_SCORING.hardcoreRules,
			...room.scoring?.hardcoreRules,
			...scoring?.hardcoreRules,
			multiplier: scoring?.hardcoreRules?.multiplier ?? hardcoreMultiplier,
		},
		themeRules: {
			...DEFAULT_ROOM_SCORING.themeRules,
			...room.scoring?.themeRules,
			...scoring?.themeRules,
			correctThemePoints: scoring?.themeRules?.correctThemePoints ?? themeGuessPoints,
		},
		tieBreaker: scoring?.tieBreaker ?? room.scoring?.tieBreaker ?? DEFAULT_ROOM_SCORING.tieBreaker,
	};
	const hardcoreRules = effectiveScoring.hardcoreRules;
	const fastestCorrectLocks = countFastestCorrectLocks(rounds);

	const ensure = (name: string) => {
		if (!byPlayer[name]) {
			byPlayer[name] = {
				playerName: name,
				correctGuesses: 0,
				correctDetailGuesses: 0,
				themeBonuses: 0,
				hardcoreBonus: 0,
				fastestCorrectLocks: 0,
				total: 0,
			};
		}
		return byPlayer[name];
	};

	// Seed rows for all players so they show up even with 0 score.
	for (const player of scoringPlayers) {
		const row = ensure(player.name);
		row.fastestCorrectLocks = fastestCorrectLocks[player.name] ?? 0;
		if (
			player.hardcore &&
			hardcoreRules.enabled &&
			hardcoreRules.rewardMode === "startBonus"
		) {
			row.hardcoreBonus += hardcoreRules.startBonusPoints;
		}
	}

	// Per-song correct guess (uses first choice)
	for (const rd of Object.values(rounds)) {
		for (const [playerName, order] of Object.entries(rd.orders)) {
			if (!scoringNames.has(playerName)) continue;
			if (order[0] === rd.correctAnswer) {
				const row = ensure(playerName);
				row.correctGuesses += guessPoints;
				if (
					hardcoreRules.enabled &&
					hardcoreRules.rewardMode === "multiplier" &&
					isMultiplierEligible(rd.locks?.[playerName])
				) {
					row.hardcoreBonus += guessPoints * (hardcoreRules.multiplier - 1);
				}
			}
		}
	}

	// Per-song bonus/detail answer (uses first choice)
	for (const rd of Object.values(rounds)) {
		if (!rd.detailCorrectAnswer || !rd.detailOrders) continue;
		for (const [playerName, order] of Object.entries(rd.detailOrders)) {
			if (!scoringNames.has(playerName)) continue;
			if (order[0] === rd.detailCorrectAnswer) {
				const row = ensure(playerName);
				row.correctDetailGuesses += detailGuessPoints;
				if (
					hardcoreRules.enabled &&
					hardcoreRules.rewardMode === "multiplier" &&
					isMultiplierEligible(rd.detailLocks?.[playerName])
				) {
					row.hardcoreBonus += detailGuessPoints * (hardcoreRules.multiplier - 1);
				}
			}
		}
	}

	// Theme bonuses (tracked in lib/score)
	for (const [playerName, points] of Object.entries(themePointsByPlayer)) {
		if (!scoringNames.has(playerName)) continue;
		ensure(playerName).themeBonuses += points;
	}

	for (const player of scoringPlayers) {
		const row = ensure(player.name);
		const base = row.correctGuesses + row.correctDetailGuesses + row.themeBonuses;
		row.hardcoreBonus = Math.round(row.hardcoreBonus * 100) / 100;
		row.total = Math.round((base + row.hardcoreBonus) * 100) / 100;
	}

	const ranked = Object.values(byPlayer).sort((a, b) => b.total - a.total);
	return { byPlayer, ranked };
}
