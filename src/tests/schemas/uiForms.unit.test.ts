import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
	createLobbyFormSchema,
	firstFieldIssue,
	joinLobbyFormSchema,
	songSubmitFormSchema,
} from "@/shared/schemas";

test("joinLobbyFormSchema trims name and normalizes room code", () => {
	const result = joinLobbyFormSchema.safeParse({
		name: "  Alice  ",
		roomCode: " ab-12 ",
	});
	assert.equal(result.success, true);
	if (!result.success) return;
	assert.equal(result.data.name, "Alice");
	assert.equal(result.data.roomCode, "AB12");
});

test("createLobbyFormSchema transforms empty URL to null", () => {
	const result = createLobbyFormSchema.safeParse({
		theme: "  90s hits  ",
		backgroundUrl: "   ",
	});
	assert.equal(result.success, true);
	if (!result.success) return;
	assert.equal(result.data.theme, "90s hits");
	assert.equal(result.data.backgroundUrl, null);
});

test("createLobbyFormSchema rejects invalid background URL", () => {
	const result = createLobbyFormSchema.safeParse({
		theme: "",
		backgroundUrl: "bad-url",
	});
	assert.equal(result.success, false);
	if (result.success) return;
	assert.equal(firstFieldIssue(result.error, "backgroundUrl"), "Enter a valid image URL");
});

test("songSubmitFormSchema requires a valid YouTube URL", () => {
	const result = songSubmitFormSchema.safeParse({
		url: "https://example.com/not-youtube",
		submitter: "Alice",
		detailAnswer: "",
	});
	assert.equal(result.success, false);
	if (result.success) return;
	assert.equal(firstFieldIssue(result.error, "url"), "Enter a valid YouTube URL");
});

test("songSubmitFormSchema transforms empty detail answer", () => {
	const result = songSubmitFormSchema.safeParse({
		url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		submitter: " Alice ",
		detailAnswer: "   ",
	});
	assert.equal(result.success, true);
	if (!result.success) return;
	assert.equal(result.data.submitter, "Alice");
	assert.equal(result.data.detailAnswer, undefined);
});

test("firstFieldIssue returns null when field has no issues", () => {
	const schema = z.object({
		a: z.string().min(2, "Too short"),
	});
	const result = schema.safeParse({ a: "x" });
	assert.equal(result.success, false);
	if (result.success) return;
	assert.equal(firstFieldIssue(result.error, "missing"), null);
});
