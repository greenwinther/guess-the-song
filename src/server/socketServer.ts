import http from "http";
import { Server } from "socket.io";
import { createRoom, getRoom, addSong, joinRoom } from "@/lib/rooms";

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

	socket.on("joinRoom", async (data: { code: string; name: string }, callback) => {
		try {
			await joinRoom(data.code, data.name);
			socket.join(data.code);

			// 1) Tell everyone “hey, someone new joined”
			io.to(data.code).emit("playerJoined", data.name);

			// 2) Fetch the fresh room (with all players + songs) and broadcast it
			const fullRoom = await getRoom(data.code);
			io.to(data.code).emit("roomData", fullRoom);

			callback(true);
		} catch (err: any) {
			console.error("joinRoom error:", err);
			callback(false);
		}
	});

	socket.on("addSong", async (data) => {
		console.log("🔔 [server] addSong received:", data);
		await addSong(data.code, { url: data.url, submitter: data.submitter });
		const fullRoom = await getRoom(data.code);
		console.log("🔔 [server] broadcasting roomData with songs:", fullRoom.songs);
		io.to(data.code).emit("roomData", fullRoom);
	});

	socket.on("disconnect", () => {
		console.log("↔️ socket disconnected", socket.id);
	});
});

const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
