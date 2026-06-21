import assert from "node:assert/strict";
import test from "node:test";
import { computeScoreBoard } from "@/server/logic/score";
import type { RoomState } from "@/server/state/roomState";
import type { RoundData } from "@/lib/game";
import { DEFAULT_ROOM_SCORING } from "@/types/room";

const cloneScoring = () => ({
	...DEFAULT_ROOM_SCORING,
	hardcoreRules: { ...DEFAULT_ROOM_SCORING.hardcoreRules },
	themeRules: { ...DEFAULT_ROOM_SCORING.themeRules },
});

const baseRoom = (): RoomState => ({
	id: 1,
	code: "AB12",
	phase: "RESULTS",
	theme: undefined,
	detailQuestion: undefined,
	backgroundUrl: null,
	players: [
		{ id: 1, name: "Host", isHost: true, roomId: 1, connected: true },
		{ id: 2, name: "Alice", isHost: false, roomId: 1, connected: true, ready: true, hardcore: false },
		{ id: 3, name: "Bob", isHost: false, roomId: 1, connected: true, ready: true, hardcore: true },
	],
	songs: [],
	adminAccessToken: "admin",
	hostAccessToken: "host",
	createdAt: Date.now(),
	updatedAt: Date.now(),
	kicked: {},
	rules: {
		...cloneScoring(),
		hardcoreMultiplier: 1.5,
		hardcoreRequired: false,
	},
	scoring: cloneScoring(),
});

test("computeScoreBoard excludes the host from seeded and calculated scores", () => {
	const room = baseRoom();
	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: {
				Host: ["Alice", "Bob"],
				Alice: ["Bob", "Alice"],
				Bob: ["Alice", "Bob"],
			},
			submitters: ["Alice", "Bob"],
			locks: {},
			detailOrders: {},
			detailLocks: {},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: { Host: 5, Alice: 1 },
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: 1.5,
	});

	assert.equal(board.byPlayer.Host, undefined);
	assert.deepEqual(
		Object.keys(board.byPlayer).sort(),
		["Alice", "Bob"]
	);
	assert.equal(board.byPlayer.Alice?.total, 1);
	assert.equal(board.byPlayer.Bob?.total, 1);
});

test("computeScoreBoard awards points for correct bonus detail answers", () => {
	const room = baseRoom();
	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: {
				Alice: ["Bob"],
				Bob: ["Alice"],
			},
			submitters: ["Alice", "Bob"],
			locks: {},
			detailCorrectAnswer: "1999",
			detailAnswers: ["1999", "2002"],
			detailOrders: {
				Alice: ["1999"],
				Bob: ["1999"],
			},
			detailLocks: {},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: {},
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: 1.5,
	});

	assert.equal(board.byPlayer.Alice?.correctGuesses, 0);
	assert.equal(board.byPlayer.Alice?.correctDetailGuesses, 1);
	assert.equal(board.byPlayer.Alice?.total, 1);
	assert.equal(board.byPlayer.Bob?.correctGuesses, 1);
	assert.equal(board.byPlayer.Bob?.correctDetailGuesses, 1);
	assert.equal(board.byPlayer.Bob?.total, 2);
});

test("computeScoreBoard respects configured scoring values", () => {
	const room = baseRoom();
	room.rules.guessPoints = 3;
	room.rules.detailGuessPoints = 2;
	room.rules.themeGuessPoints = 4;
	room.rules.hardcoreMultiplier = 2;
	room.rules.themeRules.correctThemePoints = 4;
	room.rules.hardcoreRules.multiplier = 2;

	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: {
				Alice: ["Alice"],
				Bob: ["Alice"],
			},
			submitters: ["Alice", "Bob"],
			locks: {},
			detailCorrectAnswer: "1999",
			detailAnswers: ["1999", "2002"],
			detailOrders: {
				Alice: ["1999"],
			},
			detailLocks: {},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: { Alice: 4 },
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
	});

	assert.equal(board.byPlayer.Alice?.correctGuesses, 3);
	assert.equal(board.byPlayer.Alice?.correctDetailGuesses, 2);
	assert.equal(board.byPlayer.Alice?.themeBonuses, 4);
	assert.equal(board.byPlayer.Alice?.total, 9);
	assert.equal(board.byPlayer.Bob?.correctGuesses, 3);
	assert.equal(board.byPlayer.Bob?.total, 3);
});

test("computeScoreBoard applies multiplier only to multiplier-eligible locks", () => {
	const room = baseRoom();
	room.rules.hardcoreMultiplier = 1.5;
	room.rules.hardcoreRules.rewardMode = "multiplier";
	room.rules.hardcoreRules.multiplier = 1.5;
	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: { Alice: ["Alice"], Bob: ["Alice"] },
			submitters: ["Alice", "Bob"],
			locks: {
				Alice: { locked: true, multiplierEligible: true },
				Bob: { locked: true, multiplierEligible: false },
			},
			detailOrders: {},
			detailLocks: {},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: {},
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
	});

	assert.equal(board.byPlayer.Alice?.total, 1.5);
	assert.equal(board.byPlayer.Bob?.total, 1);
});

test("computeScoreBoard adds hardcore start bonus once per hardcore player", () => {
	const room = baseRoom();
	room.rules.hardcoreRules = {
		enabled: true,
		rewardMode: "startBonus",
		startBonusPoints: 1,
		multiplier: 1.5,
	};
	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: { Alice: ["Alice"], Bob: ["Alice"] },
			submitters: ["Alice", "Bob"],
			locks: {},
		},
		2: {
			correctAnswer: "Alice",
			orders: { Bob: ["Alice"] },
			submitters: ["Alice", "Bob"],
			locks: {},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: {},
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
		scoring: room.rules,
	});

	assert.equal(board.byPlayer.Alice?.total, 1);
	assert.equal(board.byPlayer.Bob?.hardcoreBonus, 1);
	assert.equal(board.byPlayer.Bob?.total, 3);
});

test("computeScoreBoard tracks fastest correct locks and ignores wrong first locks", () => {
	const room = baseRoom();
	const rounds: Record<number, RoundData> = {
		1: {
			correctAnswer: "Alice",
			orders: { Alice: ["Bob"], Bob: ["Alice"] },
			submitters: ["Alice", "Bob"],
			locks: {
				Alice: { locked: true, lockedAt: 100 },
				Bob: { locked: true, lockedAt: 200 },
			},
		},
	};

	const board = computeScoreBoard({
		room,
		rounds,
		themePointsByPlayer: {},
		guessPoints: room.rules.guessPoints,
		detailGuessPoints: room.rules.detailGuessPoints,
		themeGuessPoints: room.rules.themeGuessPoints,
		hardcoreMultiplier: room.rules.hardcoreMultiplier,
		scoring: room.rules,
	});

	assert.equal(board.byPlayer.Alice?.fastestCorrectLocks, 0);
	assert.equal(board.byPlayer.Bob?.fastestCorrectLocks, 1);
});
