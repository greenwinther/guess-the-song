import assert from "node:assert/strict";
import test from "node:test";
import {
	addSongBodySchema,
	createRoomBodySchema,
	roomCodeParamsSchema,
	validateWithZod,
	youtubePlaylistQuerySchema,
	youtubeSearchQuerySchema,
} from "@/server/schemas";

test("roomCodeParamsSchema normalizes code from param arrays", () => {
	const result = validateWithZod(roomCodeParamsSchema, { code: [" ab-12 "] });
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.code, "AB12");
});

test("youtubeSearchQuerySchema trims query and accepts empty", () => {
	const withValue = validateWithZod(youtubeSearchQuerySchema, { q: "  my song  " });
	assert.equal(withValue.ok, true);
	if (withValue.ok) assert.equal(withValue.data.q, "my song");

	const empty = validateWithZod(youtubeSearchQuerySchema, { q: "   " });
	assert.equal(empty.ok, true);
	if (empty.ok) assert.equal(empty.data.q, undefined);
});

test("youtubePlaylistQuerySchema trims url and parses limit", () => {
	const result = validateWithZod(youtubePlaylistQuerySchema, {
		url: "  https://www.youtube.com/playlist?list=PL123  ",
		limit: "10",
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.url, "https://www.youtube.com/playlist?list=PL123");
	assert.equal(result.data.limit, 10);
});

test("createRoomBodySchema applies defaults", () => {
	const result = validateWithZod(createRoomBodySchema, {});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.deepEqual(result.data, {
		theme: "",
		backgroundUrl: null,
		hostName: "Host",
	});
});

test("addSongBodySchema rejects invalid URLs", () => {
	const result = validateWithZod(addSongBodySchema, { url: "not-a-url", submitter: "Alice" });
	assert.equal(result.ok, false);
	if (result.ok) return;
	assert.ok(result.issues.some((issue) => issue.path === "url"));
});

test("addSongBodySchema transforms optional fields", () => {
	const result = validateWithZod(addSongBodySchema, {
		url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		submitter: " Alice ",
		title: "  Song title  ",
		detailAnswer: "   ",
	});
	assert.equal(result.ok, true);
	if (!result.ok) return;
	assert.equal(result.data.submitter, "Alice");
	assert.equal(result.data.title, "Song title");
	assert.equal(result.data.detailAnswer, null);
});
