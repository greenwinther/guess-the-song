import assert from "node:assert/strict";
import test from "node:test";
import {
	addSongPayloadSchema,
	joinRoomPayloadSchema,
	revealedSongsPayloadSchema,
	scoreRulesPayloadSchema,
	submitAllOrdersPayloadSchema,
	validateWithZod,
} from "@/server/schemas";

test("joinRoomPayloadSchema normalizes room code and fallback values", () => {
	const result = validateWithZod(joinRoomPayloadSchema, {
		code: " ab-12 ",
		name: "  ",
		hardcore: "true",
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.code, "AB12");
	assert.equal(result.data.name, "Player");
	assert.equal(result.data.hardcore, false);
});

test("addSongPayloadSchema requires valid URL", () => {
	const result = validateWithZod(addSongPayloadSchema, {
		code: "AB12",
		url: "not-url",
		submitter: "Player",
		title: "",
	});
	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.ok(result.issues.some((issue) => issue.path === "url"));
});

test("revealedSongsPayloadSchema filters invalid song ids", () => {
	const result = validateWithZod(revealedSongsPayloadSchema, {
		code: "AB12",
		revealed: ["1", 2, "x", null, 3.7],
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.deepEqual(result.data.revealed, [1, 2, 3]);
});

test("submitAllOrdersPayloadSchema validates guess map keys", () => {
	const result = validateWithZod(submitAllOrdersPayloadSchema, {
		code: "AB12",
		playerName: "Bob",
		guesses: { A: ["Alice"] },
	});
	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.ok(result.issues.some((issue) => issue.path.includes("guesses")));
});

test("scoreRulesPayloadSchema parses scoring values", () => {
	const result = validateWithZod(scoreRulesPayloadSchema, {
		code: "AB12",
		guessPoints: "3",
		detailGuessPoints: "2",
		themeGuessPoints: "4",
		hardcoreMultiplier: "1.75",
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.guessPoints, 3);
	assert.equal(result.data.detailGuessPoints, 2);
	assert.equal(result.data.themeGuessPoints, 4);
	assert.equal(result.data.hardcoreMultiplier, 1.75);
});
