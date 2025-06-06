// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, addSong, joinRoom, removeSong } from "@/lib/rooms";
import { Song } from "@/types/room";
import { startRoundData, computeScores, storeOrder, activeRounds } from "@/lib/game";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const httpServer = http.createServer((req, res) => {
	if (req.url === "/" && req.method === "GET") {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("Socket server is running");
	} else {
		res.writeHead(404);
		res.end();
	}
});

// 1) Log any HTTP‐level server errors (e.g. EADDRINUSE, etc.)
httpServer.on("error", (err) => {
	console.error("🚨 HTTP server error:", err);
});

const io = new Server(httpServer, {
	cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },

	// 1) Ping every 20 sec
	pingInterval: 20_000,
	// 2) If no pong within 5 sec, time‐out
	pingTimeout: 5_000,
});

const gamesInProgress: Record<string, boolean> = {};
const finalScoresByRoom: Record<string, Record<string, number>> = {};

// 2) Log any Engine.IO connection‐level errors
io.engine.on("connection_error", (err) => {
	console.error("🚨 Engine.IO connection error:", err);
});

// 3) Log any top‐level Socket.IO errors on the namespace
io.of("/").on("connect_error", (err) => {
	console.error("🚨 Socket.IO connect_error:", err);
});

io.on("connection", (socket) => {
	console.log("↔️ socket connected", socket.id);

	// 4) Per‐socket error handler
	socket.on("error", (err) => {
		console.error(`🚨 Socket ${socket.id} error:`, err);
	});

	// ─── createRoom ─────────────────────────────────────────────────────
	socket.on("createRoom", async (data, callback) => {
		try {
			const newRoom = await createRoom(data.theme, data.backgroundUrl || null);
			socket.join(newRoom.code);
			callback({
				code: newRoom.code,
				theme: newRoom.theme,
				backgroundUrl: newRoom.backgroundUrl || undefined,
			});
			const fullRoom = await getRoom(newRoom.code);
			io.to(newRoom.code).emit("roomData", fullRoom);
		} catch (err: any) {
			console.error(err);
			socket.emit("error", err.message);
		}
	});

	// ─── addSong ─────────────────────────────────────────────────────────
	socket.on(
		"addSong",
		async (
			data: { code: string; url: string; submitter: string; title: string },
			callback: (res: { success: boolean; song?: Song; error?: string }) => void
		) => {
			try {
				const song = await addSong(data.code, {
					url: data.url,
					submitter: data.submitter,
					title: data.title,
				});
				const withTitle = { ...song, title: data.title };

				console.log("🔔 [server] emitting songAdded:", song);
				// Broadcast just the new song
				io.to(data.code).emit("songAdded", withTitle);

				callback({ success: true, song: withTitle });
			} catch (err: any) {
				console.error("🔔 [server] addSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	// ─── removeSong ──────────────────────────────────────────────────────
	socket.on(
		"removeSong",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				const deletedId = await removeSong(data.code, data.songId);

				// Broadcast to everyone in-room that this song is gone
				io.to(data.code).emit("songRemoved", { songId: deletedId });
				callback({ success: true });
			} catch (err: any) {
				console.error("removeSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	// ─── startGame ───────────────────────────────────────────────────────
	socket.on("startGame", async (data: { code: string }, callback: (ok: boolean) => void) => {
		try {
			// 1) Fetch the room and its songs
			const room = await getRoom(data.code);
			if (!room) return callback(false);

			// 2) For each song in that room, create a RoundData entry
			//    so that every songId is known up front, with the correctAnswer=submitter
			for (const song of room.songs) {
				// song.id is the unique ID
				// song.submitter is the correct answer for that song
				startRoundData(
					data.code,
					song.id,
					song.submitter,
					room.songs.map((s) => s.submitter)
				);
				// Note: we pass the full list of all submitters, but computeScores only cares about correctAnswer.
			}

			// 3) Broadcast “gameStarted” with the full room so clients can build their guess UI.
			gamesInProgress[data.code] = true;
			io.to(data.code).emit("gameStarted", room);

			callback(true);
		} catch (err: any) {
			console.error("startGame error", err);
			callback(false);
		}
	});

	// ─── playSong ────────────────────────────────────────────────────────
	socket.on(
		"playSong",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				// 1) Look up the clip
				const song = await prisma.song.findUnique({ where: { id: data.songId } });
				if (!song) {
					return callback({ success: false, error: "Song not found." });
				}

				// 4) Emit only the clip info (no more submitters payload here)
				io.to(data.code).emit("playSong", {
					songId: song.id,
					clipUrl: song.url,
				});

				callback({ success: true });
			} catch (err: any) {
				console.error("playSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	// ─── joinRoom ────────────────────────────────────────────────────────
	socket.on("joinRoom", async (data: { code: string; name: string }, callback?: (ok: boolean) => void) => {
		try {
			// …persist the newPlayer, join the socket…
			const newPlayer = await joinRoom(data.code, data.name);
			socket.join(data.code);

			// Store room + playerName on socket.data so we know, on disconnect, who to remove
			socket.data.roomMeta = { code: data.code, playerName: data.name };
			console.log("📣 Broadcasting playerJoined to room", data.code, newPlayer.name);
			io.to(data.code).emit("playerJoined", newPlayer);

			// 1) Always send the freshest Room to this socket
			const room = await getRoom(data.code);
			console.log("📣 playerJoined", newPlayer.name, "→", data.code);
			io.to(data.code).emit("playerJoined", newPlayer);
			socket.emit("roomData", room);

			// 2) If a round is already active, immediately tell them the game has started
			const roundsForCode = activeRounds[data.code];
			if (roundsForCode && Object.keys(roundsForCode).length > 0) {
				// Emit gameStarted so that JoinGameClient can flip state.gameStarted = true
				socket.emit("gameStarted", room);

				// If there’s a clip live, replay it too
				const currentSongId = Math.max(...Object.keys(roundsForCode).map(Number));
				const roundData = roundsForCode[currentSongId];
				const clip = await prisma.song.findUnique({ where: { id: currentSongId } });
				if (clip) {
					socket.emit("playSong", {
						songId: currentSongId,
						clipUrl: clip.url,
					});
				}
			}

			// 3) If the game is over already, send results
			if (finalScoresByRoom[data.code]) {
				socket.emit("gameOver", {
					scores: finalScoresByRoom[data.code]!,
				});
			}

			if (typeof callback === "function") callback(true);
		} catch (err: any) {
			console.error("🔔 joinRoom error:", err);

			if (typeof callback === "function") callback(false);
		}
	});

	// ─── submitAllOrders ─────────────────────────────────────────────────
	socket.on(
		"submitAllOrders",
		async (
			data: {
				code: string;
				playerName: string;
				guesses: Record<string /*songId*/, string[]>;
			},
			callback: (ok: boolean) => void
		) => {
			try {
				for (const [sid, order] of Object.entries(data.guesses)) {
					storeOrder(data.code, parseInt(sid, 10), data.playerName, order);
				}

				// === ADD THIS: broadcast that this player has submitted ===
				io.to(data.code).emit("playerSubmitted", { playerName: data.playerName });

				callback(true);
			} catch (err) {
				console.error("submitAllOrders error", err);
				callback(false);
			}
		}
	);

	// ─── showResults ─────────────────────────────────────────────────────
	socket.on("showResults", (data: { code: string }, callback: (ok: boolean) => void) => {
		try {
			const finalScores: Record<string, number> = {};
			const roundsForCode = activeRounds[data.code] || {};

			for (const rd of Object.values(roundsForCode)) {
				const perSong = computeScores(rd.orders, rd.correctAnswer);
				for (const [player, pts] of Object.entries(perSong)) {
					finalScores[player] = (finalScores[player] || 0) + pts;
				}
			}

			// 1) cache them
			finalScoresByRoom[data.code] = finalScores;

			// 2) broadcast the end-of-game
			io.to(data.code).emit("gameOver", { scores: finalScores });
			callback(true);
		} catch (err) {
			console.error("showResults error", err);
			callback(false);
		}
	});

	// ─── disconnect ──────────────────────────────────────────────────────
	socket.on("disconnect", async (reason) => {
		console.log("↔️ socket disconnected", socket.id);
		console.log(`↔️ socket ${socket.id} disconnected:`, reason);

		// If we had stored room+playerName in socket.data, remove them now:
		const meta = socket.data.roomMeta as { code: string; playerName: string } | undefined;
		if (meta) {
			const { code, playerName } = meta;

			try {
				const updated = await getRoom(code);
				io.to(code).emit("roomData", updated);
			} catch (err) {
				console.error("[disconnect] cleanup error", err);
			}
		}
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
