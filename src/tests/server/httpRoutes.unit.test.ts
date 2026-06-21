import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { registerHttpRoutes } from "@/server/http/registerHttpRoutes";
import {
	createRoom,
	getRoom,
	importRoomStoreState,
	setPhase,
} from "@/server/store/roomStore";

test("HTTP song creation route is not exposed", async () => {
	importRoomStoreState(null);
	const app = express();
	app.use(express.json());
	registerHttpRoutes(app);
	const server = app.listen(0);

	try {
		await new Promise<void>((resolve) => server.once("listening", resolve));
		const port = (server.address() as AddressInfo).port;
		const room = createRoom("", null, "Host");
		setPhase(room.code, "GUESSING");

		const response = await fetch(`http://127.0.0.1:${port}/api/rooms/${room.code}/songs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				submitter: "Alice",
				title: "Unexpected song",
			}),
		});

		assert.equal(response.status, 404);
		assert.equal(getRoom(room.code)?.songs.length, 0);
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				importRoomStoreState(null);
				if (error) reject(error);
				else resolve();
			});
		});
	}
});
