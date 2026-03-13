import assert from "node:assert/strict";
import test from "node:test";
import { ROOM_IDLE_TTL_MS, shouldDeleteRoom } from "@/server/cleanupScheduler";
import type { RoomState } from "@/server/state/roomState";

const baseRoom = (): RoomState => ({
	id: 1,
	code: "AB12",
	phase: "LOBBY",
	theme: undefined,
	detailQuestion: undefined,
	backgroundUrl: null,
	players: [{ id: 1, name: "Host", isHost: true, roomId: 1, connected: true }],
	songs: [],
	createdAt: 1_000,
	updatedAt: 2_000,
	kicked: {},
	rules: {
		hardcoreMultiplier: 1.5,
		hardcoreRequired: false,
	},
});

test("shouldDeleteRoom keeps recently inactive empty rooms", () => {
	const room = baseRoom();
	const result = shouldDeleteRoom(room, 0, room.updatedAt + ROOM_IDLE_TTL_MS - 1);
	assert.equal(result, false);
});

test("shouldDeleteRoom deletes empty rooms once inactive for 24 hours", () => {
	const room = baseRoom();
	const result = shouldDeleteRoom(room, 0, room.updatedAt + ROOM_IDLE_TTL_MS);
	assert.equal(result, true);
});

test("shouldDeleteRoom never deletes rooms with connected sockets", () => {
	const room = baseRoom();
	const result = shouldDeleteRoom(room, 2, room.updatedAt + ROOM_IDLE_TTL_MS * 2);
	assert.equal(result, false);
});
