import assert from "node:assert/strict";
import test from "node:test";
import { getYouTubeID, getYouTubePlaylistID } from "@/lib/youtube";

test("getYouTubeID extracts video IDs from supported URL formats", () => {
	assert.equal(getYouTubeID("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
	assert.equal(getYouTubeID("https://youtu.be/dQw4w9WgXcQ?t=10"), "dQw4w9WgXcQ");
	assert.equal(getYouTubeID("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("getYouTubePlaylistID extracts playlist IDs from supported URL formats", () => {
	assert.equal(
		getYouTubePlaylistID("https://www.youtube.com/playlist?list=PL1234567890"),
		"PL1234567890",
	);
	assert.equal(
		getYouTubePlaylistID("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890"),
		"PL1234567890",
	);
	assert.equal(getYouTubePlaylistID("not-a-playlist"), null);
});
