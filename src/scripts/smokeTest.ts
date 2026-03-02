import { io, type Socket } from "socket.io-client";
import type { CreateRoomResponse } from "@/types/socket";
import type { Submission } from "@/types/submission";

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:4000";
const TIMEOUT_MS = 10000;

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

const waitForEvent = <T>(socket: Socket, event: string, timeoutMs = TIMEOUT_MS): Promise<T> => {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout waiting for ${event}`));
		}, timeoutMs);
		socket.once(event, (data: T) => {
			clearTimeout(timer);
			resolve(data);
		});
	});
};

const waitForConnect = (socket: Socket, timeoutMs = TIMEOUT_MS) => {
	if (socket.connected) return Promise.resolve();
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("Socket connect timeout")), timeoutMs);
		socket.once("connect", () => {
			clearTimeout(timer);
			resolve();
		});
		socket.once("connect_error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
};

async function run() {
	console.log("[smoke] connecting host...");
	const host = io(SOCKET_URL, { transports: ["websocket"] });
	await waitForConnect(host);

	const room = await new Promise<CreateRoomResponse>((resolve, reject) => {
		host.emit(
			"createRoom",
			{ theme: "", backgroundUrl: null, hostName: "Host" },
			(resp: CreateRoomResponse) => {
				if (!resp?.code) return reject(new Error("createRoom failed"));
				resolve(resp);
			}
		);
	});

	console.log("[smoke] room created", room.code);
	await new Promise<void>((resolve, reject) => {
		host.emit("joinRoom", { code: room.code, name: "Host" }, (ok: boolean) => {
			if (!ok) return reject(new Error("host joinRoom failed"));
			resolve();
		});
	});

	const songs = [
		{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Rick Astley" },
		{ url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", title: "Daft Punk" },
	];
	const songIds: number[] = [];

	for (const s of songs) {
		await new Promise<void>((resolve, reject) => {
			host.emit(
				"addSong",
				{ code: room.code, url: s.url, submitter: "Host", title: s.title },
				(res: { success: boolean; error?: string; song?: Submission }) => {
					if (!res?.success) return reject(new Error(res?.error || "addSong failed"));
					if (res.song?.id) songIds.push(res.song.id);
					resolve();
				}
			);
		});
	}

	console.log("[smoke] songs added");

	await new Promise<void>((resolve, reject) => {
		host.emit("startGame", { code: room.code }, (ok: boolean) => {
			if (!ok) return reject(new Error("startGame failed"));
			resolve();
		});
	});

	console.log("[smoke] game started");

	console.log("[smoke] connecting player...");
	const player = io(SOCKET_URL, { transports: ["websocket"] });
	await waitForConnect(player);

	const songChangedPromise = waitForEvent<{ songId: number | null }>(player, "songChanged");
	await new Promise<void>((resolve, reject) => {
		player.emit("joinRoom", { code: room.code, name: "Player1" }, (ok: boolean) => {
			if (!ok) return reject(new Error("joinRoom failed"));
			resolve();
		});
	});

	const songChanged = await songChangedPromise;
	if (!songChanged.songId) throw new Error("No active song id after startGame");

	await new Promise<void>((resolve, reject) => {
		player.emit(
			"lockAnswer",
			{ code: room.code, songId: songChanged.songId, playerName: "Player1" },
			(ok: boolean) => {
				if (!ok) return reject(new Error("lockAnswer failed"));
				resolve();
			}
		);
	});

	console.log("[smoke] player locked answer");
	await wait(200);
	player.disconnect();

	console.log("[smoke] reconnecting player...");
	const player2 = io(SOCKET_URL, { transports: ["websocket"] });
	await waitForConnect(player2);
	const lockSnapshotPromise = waitForEvent<{ songId: number | null; locked: string[] }>(
		player2,
		"lockSnapshot"
	);
	const reconnectSongChangedPromise = waitForEvent<{ songId: number | null }>(player2, "songChanged");
	await new Promise<void>((resolve, reject) => {
		player2.emit("joinRoom", { code: room.code, name: "Player1" }, (ok: boolean) => {
			if (!ok) return reject(new Error("rejoin failed"));
			resolve();
		});
	});
	const snapshot = await lockSnapshotPromise;
	const reconnectSongChanged = await reconnectSongChangedPromise;
	if (!snapshot.locked?.includes("Player1")) {
		throw new Error("Lock did not persist after reconnect");
	}
	if (!reconnectSongChanged.songId) {
		throw new Error("No active song id after reconnect");
	}

	console.log("[smoke] hardcore lock step...");
	const hardcorePlayer = io(SOCKET_URL, { transports: ["websocket"] });
	await waitForConnect(hardcorePlayer);
	const hardcoreLockPromise = waitForEvent<{ songId: number; lockedNames?: string[] }>(
		host,
		"songFinalized"
	);
	await new Promise<void>((resolve, reject) => {
		hardcorePlayer.emit(
			"joinRoom",
			{ code: room.code, name: "Hardcore", hardcore: true },
			(ok: boolean) => {
				if (!ok) return reject(new Error("hardcore join failed"));
				resolve();
			}
		);
	});
	await new Promise<void>((resolve) => host.emit("nextSong", { code: room.code }, () => resolve()));
	const hardcoreSnapshot = await hardcoreLockPromise;
	if (!hardcoreSnapshot.lockedNames?.includes("Hardcore")) {
		throw new Error("Hardcore player was not auto-locked on nextSong");
	}
	await wait(200);
	hardcorePlayer.disconnect();

	// Theme smoke step
	console.log("[smoke] theme step...");
	const themeUpdatedPromise = waitForEvent<{ theme?: string }>(player2, "THEME_UPDATED");
	host.emit("THEME_EDIT", { code: room.code, theme: "Summer Vibes" });
	await themeUpdatedPromise;

	const themeSolvedPromise = waitForEvent<{ playerName: string }>(player2, "THEME_SOLVED");
	player2.emit("THEME_GUESS", { code: room.code, playerName: "Player1", guess: "Summer Vibes" });
	const solved = await themeSolvedPromise;
	if (solved.playerName !== "Player1") {
		throw new Error("Theme solve did not register");
	}

	const themeRevealedPromise = waitForEvent<unknown>(player2, "THEME_REVEALED");
	host.emit("THEME_REVEAL", { code: room.code });
	await themeRevealedPromise;

	// Mid-game playback + reveal submitter + results flow
	console.log("[smoke] playback + reveal step...");
	const firstSongId = songIds[0] ?? reconnectSongChanged.songId;
	if (!firstSongId) throw new Error("Missing first song id");

	await new Promise<void>((resolve, reject) => {
		host.emit("playSong", { code: room.code, songId: firstSongId }, (res: { success: boolean }) => {
			if (!res?.success) return reject(new Error("playSong failed"));
			resolve();
		});
	});
	await waitForEvent<number[]>(player2, "revealedSongs");

	await new Promise<void>((resolve) => host.emit("nextSong", { code: room.code }, () => resolve()));
	await waitForEvent<{ songId: number | null }>(player2, "songChanged");

	const recapRoomPromise = waitForEvent<{ phase?: string }>(player2, "roomData");
	await new Promise<void>((resolve) => host.emit("nextSong", { code: room.code }, () => resolve()));
	await waitForEvent<{ songId: number | null }>(player2, "songChanged");
	const recapRoom = await recapRoomPromise;
	if (recapRoom.phase !== "RECAP") {
		throw new Error(`Expected phase RECAP, got ${recapRoom.phase ?? "unknown"}`);
	}

	const gameOverPromise = waitForEvent<{ scores: Record<string, number> }>(player2, "gameOver");
	await new Promise<void>((resolve, reject) => {
		host.emit("showResults", { code: room.code }, (ok: boolean) => {
			if (!ok) return reject(new Error("showResults failed"));
			resolve();
		});
	});
	const gameOver = await gameOverPromise;
	const totals = Object.values(gameOver.scores ?? {});
	if (totals.length === 0) {
		throw new Error("gameOver missing scores");
	}
	if (!totals.some((value) => value > 0)) {
		throw new Error("no positive scores in results");
	}

	// reveal submitter in results
	const submitterRevealedPromise = waitForEvent<{ songId: number }>(player2, "submitterRevealed");
	host.emit("revealSubmitter", { code: room.code, songId: firstSongId });
	await submitterRevealedPromise;

	// reveal all submitters in batch
	await new Promise<void>((resolve, reject) => {
		host.emit("joinRoom", { code: room.code, name: "Host" }, (ok: boolean) => {
			if (!ok) return reject(new Error("host rejoin failed"));
			resolve();
		});
	});
	const submitterRevealedAllPromise = waitForEvent<{ songIds: number[] }>(
		player2,
		"submitterRevealedAll"
	);
	host.emit("revealSubmitterAll", { code: room.code });
	const allPayload = await submitterRevealedAllPromise;
	if (!allPayload.songIds?.length) throw new Error("submitterRevealedAll missing songIds");

	host.disconnect();
	player2.disconnect();
	console.log("[smoke] done");
}

run().catch((err) => {
	console.error("[smoke] failed", err);
	process.exit(1);
});
