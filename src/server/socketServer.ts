// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, addSong, joinRoom } from "@/lib/rooms";
import { Song } from "@/types/room";
import { startRoundData, lookupCorrectAnswer, computeScores, storeOrder, getAllOrders } from "@/lib/game";
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

	socket.on("joinRoom", async (data: { code: string; name: string }, callback: (ok: boolean) => void) => {
		try {
			// Persist & retrieve the Player record with id, name, roomId
			const newPlayer = await joinRoom(data.code, data.name);
			socket.join(data.code);

			console.log("🔔 [server] newPlayer:", newPlayer);
			// Now broadcast the full object
			io.to(data.code).emit("playerJoined", newPlayer);

			callback(true);
		} catch (err: any) {
			console.error("🔔 joinRoom error:", err);
			callback(false);
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

	// 1. Host starts the next round

	socket.on(
		"startRound",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				// Load just the chosen song
				const song = await prisma.song.findUnique({ where: { id: data.songId } });
				if (!song) return callback({ success: false, error: "Song not found." });

				// Store round + “correct answer” (here using URL as placeholder)
				startRoundData(data.code, song.id, song.url);
				io.to(data.code).emit("roundStarted", {
					songId: song.id,
					clipUrl: song.url,
				});

				callback({ success: true });
			} catch (err: any) {
				console.error("startRound error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	// 2. Players submit guesses
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
	socket.on("endRound", (data: { code: string; songId: number }, callback: (ok: boolean) => void) => {
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

	socket.on("gameStarted", ({ code }, callback) => {
		// You could load initial game state here if needed
		io.to(code).emit("gameStarted");
		callback(true);
	});

	socket.on("disconnect", () => {
		console.log("↔️ socket disconnected", socket.id);
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
