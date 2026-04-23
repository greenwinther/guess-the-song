import type { Room } from "@/types/room";
import type { RoundData } from "@/lib/game";
import type { ScoreBoard, ScoreRow } from "./types";

type ScoreInputs = {
	room: Room;
	rounds: Record<number, RoundData>;
	themePointsByPlayer: Record<string, number>;
	hardcoreMultiplier?: number;
};

export function computeScoreBoard({
	room,
	rounds,
	themePointsByPlayer,
	hardcoreMultiplier = 1.5,
}: ScoreInputs): ScoreBoard {
	const byPlayer: Record<string, ScoreRow> = {};
	const scoringPlayers = room.players.filter((player) => !player.isHost);
	const scoringNames = new Set(scoringPlayers.map((player) => player.name));

	const ensure = (name: string) => {
		if (!byPlayer[name]) {
			byPlayer[name] = {
				playerName: name,
				correctGuesses: 0,
				correctDetailGuesses: 0,
				themeBonuses: 0,
				hardcoreBonus: 0,
				total: 0,
			};
		}
		return byPlayer[name];
	};

	// Seed rows for all players so they show up even with 0 score.
	for (const player of scoringPlayers) ensure(player.name);

	// Per-song correct guess (uses first choice)
	for (const rd of Object.values(rounds)) {
		for (const [playerName, order] of Object.entries(rd.orders)) {
			if (!scoringNames.has(playerName)) continue;
			if (order[0] === rd.correctAnswer) {
				ensure(playerName).correctGuesses += 1;
			}
		}
	}

	// Per-song bonus/detail answer (uses first choice)
	for (const rd of Object.values(rounds)) {
		if (!rd.detailCorrectAnswer || !rd.detailOrders) continue;
		for (const [playerName, order] of Object.entries(rd.detailOrders)) {
			if (!scoringNames.has(playerName)) continue;
			if (order[0] === rd.detailCorrectAnswer) {
				ensure(playerName).correctDetailGuesses += 1;
			}
		}
	}

	// Theme bonuses (tracked in lib/score)
	for (const [playerName, points] of Object.entries(themePointsByPlayer)) {
		if (!scoringNames.has(playerName)) continue;
		ensure(playerName).themeBonuses += points;
	}

	// Hardcore multiplier (apply on base)
	for (const player of scoringPlayers) {
		const row = ensure(player.name);
		const base = row.correctGuesses + row.correctDetailGuesses + row.themeBonuses;
		if (player.hardcore) {
			const boosted = Math.round(base * hardcoreMultiplier * 100) / 100;
			row.hardcoreBonus = boosted - base;
			row.total = boosted;
		} else {
			row.total = base;
		}
	}

	const ranked = Object.values(byPlayer).sort((a, b) => b.total - a.total);
	return { byPlayer, ranked };
}
