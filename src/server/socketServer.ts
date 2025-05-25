import http from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, addSong, joinRoom } from "@/lib/rooms";
import { Song } from "@/contexts/GameContext";

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
			data: { code: string; url: string; submitter: string },
			callback: (res: { success: boolean; song?: Song; error?: string }) => void
		) => {
			try {
				// Persist & get back `id` + `roomId`
				const song = await addSong(data.code, {
					url: data.url,
					submitter: data.submitter,
				});

				console.log("🔔 [server] emitting songAdded:", song);
				// Broadcast just the new song
				io.to(data.code).emit("songAdded", song);

				callback({ success: true, song });
			} catch (err: any) {
				console.error("🔔 [server] addSong error", err);
				callback({ success: false, error: err.message });
			}
		}
	);

	socket.on("disconnect", () => {
		console.log("↔️ socket disconnected", socket.id);
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
