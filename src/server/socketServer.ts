// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, addSong, joinRoom, removeSong } from "@/lib/rooms";
import { Song } from "@/types/room";
import {
	startRoundData,
	lookupCorrectAnswer,
	computeScores,
	storeOrder,
	getAllOrders,
	activeRounds,
} from "@/lib/game";
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

const io = new Server(httpServer, {
	cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },
});

const gamesStarted = new Set<string>();

io.on("connection", (socket) => {
	console.log("↔️ socket connected", socket.id);

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

	// 5) Remove a song
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

	// 1) Host clicks “Start Game” in the lobby

	socket.on("gameStarted", ({ code }: { code: string }, callback: (ok: boolean) => void) => {
		// mark the room as in‐game
		gamesStarted.add(code);

		// broadcast to everyone in that room
		io.to(code).emit("gameStarted");
		callback(true);
	});

	// 2) Host picks a song → round begins
	socket.on(
		"startGame",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				// 1) Mark room as in‐game
				gamesStarted.add(data.code);

				// 2) Load the chosen song
				const song = await prisma.song.findUnique({ where: { id: data.songId } });
				if (!song) return callback({ success: false, error: "Song not found." });

				// 3) Gather all submitter names (players who added songs)
				const room = await getRoom(data.code);
				const submitters = room.songs.map((s) => s.submitter);

				// 4) Persist the round
				startRoundData(data.code, song.id, song.submitter, submitters);

				// 5a) Navigate everyone (including late-joiners) into the game page
				io.to(data.code).emit("gameStarted");

				// 5b) Then broadcast the actual round data (clip + submitters)
				io.to(data.code).emit("roundStarted", {
					songId: song.id,
					clipUrl: song.url,
					submitters,
				});

				callback({ success: true });
			} catch (err: any) {
				console.error("startGame error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	// 3) Any socket (host or player) calls joinRoom

	socket.on("joinRoom", async (data: { code: string; name: string }, callback: (ok: boolean) => void) => {
		try {
			// Persist & retrieve the Player record with id, name, roomId
			const newPlayer = await joinRoom(data.code, data.name);
			socket.join(data.code);

			// Now broadcast the full object
			console.log("🔔 [server] newPlayer:", newPlayer);
			io.to(data.code).emit("playerJoined", newPlayer);

			// replay navigation if the game already started
			if (gamesStarted.has(data.code)) {
				socket.emit("gameStarted");
			}

			// replay in-flight round if already kicked off
			const roundsForCode = activeRounds[data.code];
			if (roundsForCode) {
				const songIds = Object.keys(roundsForCode).map((i) => parseInt(i, 10));
				const current = Math.max(...songIds);
				const rd = roundsForCode[current];
				const theSong = await prisma.song.findUnique({ where: { id: current } });
				if (theSong) {
					socket.emit("roundStarted", {
						songId: current,
						clipUrl: theSong.url,
						submitters: rd.submitters,
					});
				}
			}

			callback(true);
		} catch (err: any) {
			console.error("🔔 joinRoom error:", err);
			callback(false);
		}
	});

	// 4. Players submit guesses

	socket.on(
		"submitOrder",
		(
			data: { code: string; songId: number; order: string[]; playerName: string },
			callback: (ok: boolean) => void
		) => {
			try {
				storeOrder(data.code, data.songId, data.playerName, data.order);
				callback(true);
			} catch {
				callback(false);
			}
		}
	);

	//    This could be a server‐side setTimeout after emit("roundStarted")
	socket.on("showResults", (data: { code: string; songId: number }, callback: (ok: boolean) => void) => {
		try {
			const correctAnswer = lookupCorrectAnswer(data.code, data.songId);
			const allOrders = getAllOrders(data.code, data.songId);
			const scores = computeScores(allOrders, correctAnswer);
			io.to(data.code).emit("roundEnded", { songId: data.songId, correctAnswer, scores });
			callback(true);
		} catch {
			callback(false);
		}
	});

	socket.on("disconnect", () => {
		console.log("↔️ socket disconnected", socket.id);
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
