import assert from "node:assert/strict";
import test from "node:test";
import {
	buildAdminSetupExport,
	parseAdminSetupImport,
} from "@/components/admin/pregame/playlist/adminSetupTransfer";
import { DEFAULT_ROOM_SCORING, type Room } from "@/types/room";

const createRoom = (): Room => ({
	id: 1,
	code: "ABCD",
	phase: "LOBBY",
	theme: "Travel",
	detailQuestion: "Which city?",
	hardcoreRequired: true,
	scoring: {
		...DEFAULT_ROOM_SCORING,
		guessPoints: 2,
		detailGuessPoints: 3,
		themeGuessPoints: 4,
		hardcoreMultiplier: 2,
		hardcoreRules: {
			enabled: true,
			rewardMode: "startBonus",
			startBonusPoints: 5,
			multiplier: 2,
		},
		themeRules: {
			guessesPerSong: 3,
			correctThemePoints: 4,
			firstCorrectThemeBonusEnabled: true,
			firstCorrectThemePoints: 6,
		},
		tieBreaker: "fastestCorrectLocks",
	},
	players: [],
	songs: [
		{
			id: 10,
			roomId: 1,
			url: "https://youtube.com/watch?v=abc12345678",
			submitter: "Sara",
			title: "Song A",
			detailAnswer: "Paris",
		},
	],
});

test("admin setup export round-trips nested scoring rules", () => {
	const exported = buildAdminSetupExport(createRoom());
	const imported = parseAdminSetupImport(JSON.stringify(exported));

	assert.equal(imported.setup.hardcoreRequired, true);
	assert.equal(imported.setup.scoring.guessPoints, 2);
	assert.equal(imported.setup.scoring.detailGuessPoints, 3);
	assert.equal(imported.setup.scoring.themeGuessPoints, 4);
	assert.equal(imported.setup.scoring.hardcoreMultiplier, 2);
	assert.deepEqual(imported.setup.scoring.hardcoreRules, {
		enabled: true,
		rewardMode: "startBonus",
		startBonusPoints: 5,
		multiplier: 2,
	});
	assert.deepEqual(imported.setup.scoring.themeRules, {
		guessesPerSong: 3,
		correctThemePoints: 4,
		firstCorrectThemeBonusEnabled: true,
		firstCorrectThemePoints: 6,
	});
	assert.equal(imported.setup.scoring.tieBreaker, "fastestCorrectLocks");
	assert.equal(imported.setup.songs[0]?.detailAnswer, "Paris");
});

test("admin setup import accepts legacy flat scoring files", () => {
	const imported = parseAdminSetupImport(
		JSON.stringify({
			version: 1,
			exportedAt: "2026-01-01T00:00:00.000Z",
			source: { code: "OLD1" },
			setup: {
				theme: "Legacy",
				detailQuestion: "",
				hardcoreRequired: false,
				scoring: {
					guessPoints: 1,
					detailGuessPoints: 1,
					themeGuessPoints: 2,
					hardcoreMultiplier: 1.5,
				},
				songs: [],
			},
		}),
	);

	assert.equal(imported.setup.scoring.themeRules.correctThemePoints, 2);
	assert.equal(imported.setup.scoring.themeRules.guessesPerSong, 1);
	assert.equal(imported.setup.scoring.hardcoreRules.rewardMode, "multiplier");
	assert.equal(imported.setup.scoring.hardcoreRules.multiplier, 1.5);
	assert.equal(imported.setup.scoring.tieBreaker, "none");
});

test("admin setup import accepts nested scoring without legacy flat theme or multiplier fields", () => {
	const imported = parseAdminSetupImport(
		JSON.stringify({
			version: 1,
			setup: {
				theme: "Nested",
				detailQuestion: "",
				hardcoreRequired: false,
				scoring: {
					guessPoints: 1,
					detailGuessPoints: 1,
					hardcoreRules: {
						enabled: true,
						rewardMode: "multiplier",
						startBonusPoints: 1,
						multiplier: 1.75,
					},
					themeRules: {
						guessesPerSong: 2,
						correctThemePoints: 3,
						firstCorrectThemeBonusEnabled: true,
						firstCorrectThemePoints: 5,
					},
					tieBreaker: "fastestCorrectLocks",
				},
				songs: [],
			},
		}),
	);

	assert.equal(imported.setup.scoring.themeGuessPoints, 3);
	assert.equal(imported.setup.scoring.hardcoreMultiplier, 1.75);
	assert.equal(imported.setup.scoring.themeRules.guessesPerSong, 2);
	assert.equal(imported.setup.scoring.tieBreaker, "fastestCorrectLocks");
});
