import assert from "node:assert/strict";
import test from "node:test";
import { createRoom, getRoom, importRoomStoreState, joinRoomWithIdentity } from "@/server/store/roomStore";

test("joinRoomWithIdentity resolves host by host token regardless of submitted name", () => {
	importRoomStoreState(null);
	try {
		const room = createRoom("", null, "Alice");
		const hostToken = room.hostAccessToken;

		const joined = joinRoomWithIdentity(room.code, "Host", false, "host-client-1", hostToken);
		const updatedRoom = getRoom(room.code);

		assert.equal(joined.created, false);
		assert.equal(joined.player.isHost, true);
		assert.equal(joined.player.name, "Alice");
		assert.equal(updatedRoom?.players.length, 1);
		assert.equal(updatedRoom?.players[0]?.isHost, true);
		assert.equal(updatedRoom?.players[0]?.name, "Alice");
	} finally {
		importRoomStoreState(null);
	}
});
