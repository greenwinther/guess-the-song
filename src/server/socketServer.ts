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

const io = new Server(httpServer, {
	cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },
});

const finalScoresByRoom: Record<string, Record<string, number>> = {};

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

	// 2) Host picks a song → round begins
	socket.on(
		"playSong",
		async (
			data: { code: string; songId: number },
			callback: (res: { success: boolean; error?: string }) => void
		) => {
			try {
				// 2) Load the chosen song
				const song = await prisma.song.findUnique({ where: { id: data.songId } });
				if (!song) return callback({ success: false, error: "Song not found." });

				// 3) collect all submitter names
				const room = await getRoom(data.code);
				const submitters = room.songs.map((s) => s.submitter);

				// 4) Persist the round
				startRoundData(data.code, song.id, song.submitter, submitters);

				// 5a) Navigate everyone (including late-joiners) into the game page
				io.to(data.code).emit("playSong", {
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
			io.to(data.code).emit("playerJoined", newPlayer);

			// replay in-flight round if already kicked off
			const roundsForCode = activeRounds[data.code];
			if (roundsForCode) {
				const songIds = Object.keys(roundsForCode).map(Number);
				const current = Math.max(...songIds);
				const rd = roundsForCode[current];
				const clip = await prisma.song.findUnique({ where: { id: current } });
				if (clip) {
					socket.emit("playSong", {
						songId: current,
						clipUrl: clip.url,
						submitters: rd.submitters,
					});
				}
			}

			if (finalScoresByRoom[data.code]) {
				socket.emit("gameOver", {
					scores: finalScoresByRoom[data.code]!,
				});
			}

			callback(true);
		} catch (err: any) {
			console.error("🔔 joinRoom error:", err);
			callback(false);
		}
	});

	// 4a) Collect every player’s guesses in one shot
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
				callback(true);
			} catch (err) {
				console.error("submitAllOrders error", err);
				callback(false);
			}
		}
	);

	// 5) When the host is finally ready, score every round and send totals
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

	socket.on("disconnect", () => {
		console.log("↔️ socket disconnected", socket.id);
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
