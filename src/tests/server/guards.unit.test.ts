import assert from "node:assert/strict";
import test from "node:test";
import { requireHost, requireMember, requireNonHostMember, requireRoom } from "@/server/logic/guards";
import { importRoomStoreState } from "@/server/store/roomStore";
import type { RoomState } from "@/server/state/roomState";
import type { SocketData } from "@/types/socket";

type FakeSocket = {
	data: SocketData;
};

const baseRoom = (): RoomState => ({
	id: 1,
	code: "AB12",
	phase: "LOBBY",
	theme: undefined,
	detailQuestion: undefined,
	backgroundUrl: null,
	players: [
		{ id: 1, name: "Host", isHost: true, roomId: 1, connected: true },
		{ id: 2, name: "Alice", isHost: false, roomId: 1, connected: true, ready: false, hardcore: false },
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

const withRoomStore = (room: RoomState) => {
	importRoomStoreState({
		rooms: [room],
		nextRoomId: 2,
		nextPlayerId: 3,
		nextSongId: 1,
	});
};

const clearRoomStore = () => {
	importRoomStoreState(null);
};

test("requireRoom returns the bound room from socket metadata", () => {
	const room = baseRoom();
	withRoomStore(room);

	try {
		const socket = { data: { roomMeta: { code: room.code, playerName: "Alice" } } } as FakeSocket;
		const result = requireRoom(socket as never);
		assert.equal(result?.code, room.code);
	} finally {
		clearRoomStore();
	}
});

test("requireMember resolves the joined player from room metadata", () => {
	const room = baseRoom();
	const socket = { data: { roomMeta: { code: room.code, playerName: "Alice" } } } as FakeSocket;

	const member = requireMember(socket as never, room);
	assert.equal(member?.name, "Alice");
	assert.equal(member?.isHost, false);
});

test("requireNonHostMember rejects host sockets", () => {
	const room = baseRoom();
	const socket = { data: { roomMeta: { code: room.code, playerName: "Host" } } } as FakeSocket;
	let error: string | null = null;

	const member = requireNonHostMember(socket as never, room, (reason) => {
		error = reason;
	});

	assert.equal(member, null);
	assert.equal(error, "HOST_NOT_ALLOWED");
});

test("requireHost accepts host sockets and rejects players", () => {
	const room = baseRoom();
	const hostSocket = { data: { roomMeta: { code: room.code, playerName: "Host" } } } as FakeSocket;
	const playerSocket = { data: { roomMeta: { code: room.code, playerName: "Alice" } } } as FakeSocket;
	let error: string | null = null;

	const host = requireHost(hostSocket as never, room);
	const player = requireHost(playerSocket as never, room, (reason) => {
		error = reason;
	});

	assert.equal(host?.name, "Host");
	assert.equal(player, null);
	assert.equal(error, "NOT_HOST");
});

test("requireRoom reports missing room metadata", () => {
	clearRoomStore();
	const socket = { data: {} } as FakeSocket;
	let error: string | null = null;

	const room = requireRoom(socket as never, (reason) => {
		error = reason;
	});

	assert.equal(room, null);
	assert.equal(error, "NO_ROOM");
});
