import assert from "node:assert/strict";
import test from "node:test";
import { computeScoreBoard } from "@/server/logic/score";
import type { RoomState } from "@/server/state/roomState";
import type { RoundData } from "@/lib/game";

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
	createdAt: Date.now(),
	updatedAt: Date.now(),
	kicked: {},
	rules: {
		hardcoreMultiplier: 1.5,
		hardcoreRequired: false,
	},
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
		hardcoreMultiplier: 1.5,
	});

	assert.equal(board.byPlayer.Host, undefined);
	assert.deepEqual(
		Object.keys(board.byPlayer).sort(),
		["Alice", "Bob"]
	);
	assert.equal(board.byPlayer.Alice?.total, 1);
	assert.equal(board.byPlayer.Bob?.total, 1.5);
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
		hardcoreMultiplier: 1.5,
	});

	assert.equal(board.byPlayer.Alice?.correctGuesses, 0);
	assert.equal(board.byPlayer.Alice?.correctDetailGuesses, 1);
	assert.equal(board.byPlayer.Alice?.total, 1);
	assert.equal(board.byPlayer.Bob?.correctGuesses, 1);
	assert.equal(board.byPlayer.Bob?.correctDetailGuesses, 1);
	assert.equal(board.byPlayer.Bob?.total, 3);
});
