import { createServer } from "http";
import { Server, Socket } from "socket.io";

// Define your types:

interface Song {
	url: string;
	submitter: string;
}

interface Player {
	id: string;
	name: string;
	isHost?: boolean;
	// add other properties as needed
}

interface Room {
	roomId: string;
	hostId: string;
	songs: Song[];
	players: Player[];
	// other game state
}

const rooms: Map<string, Room> = new Map();

const httpServer = createServer();
const io = new Server(httpServer, {
	path: "/api/socket", // match your client config if any
	// cors: { origin: "*" } // configure cors if needed
});

// At top, after your rooms map:
const hostDisconnectTimeouts = new Map<string, NodeJS.Timeout>();

io.on("connection", (socket: Socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on("host:createRoom", ({ roomId, songs }: { roomId: string; songs: Song[] }) => {
		rooms.set(roomId, {
			roomId,
			hostId: socket.id,
			songs,
			players: [],
		});
		socket.join(roomId);
		console.log(`Host created room ${roomId} with socket ${socket.id}`);
	});

	socket.on("host:rejoinRoom", ({ roomId }: { roomId: string }) => {
		const room = rooms.get(roomId);
		if (!room) {
			socket.emit("error", "Room not found");
			return;
		}

		// Clear any existing disconnect timeout
		if (hostDisconnectTimeouts.has(roomId)) {
			clearTimeout(hostDisconnectTimeouts.get(roomId)!);
			hostDisconnectTimeouts.delete(roomId);
			console.log(`Host reconnected before timeout, cleared timer for room ${roomId}`);
		}

		room.hostId = socket.id;
		socket.join(roomId);
		socket.emit("host:rejoinSuccess", { room });
		io.to(roomId).emit("host:reconnected");
		console.log(`Host rejoined room ${roomId} with socket ${socket.id}`);
	});

	socket.on("disconnect", () => {
		for (const [roomId, room] of rooms.entries()) {
			if (room.hostId === socket.id) {
				console.log(`Host disconnected from room ${roomId}`);

				io.to(roomId).emit("host:disconnected");

				const timeout = setTimeout(() => {
					console.log(`Host did not reconnect. Closing room ${roomId}`);

					io.to(roomId).emit("room:closed");

					rooms.delete(roomId);
					hostDisconnectTimeouts.delete(roomId);

					const clients = io.sockets.adapter.rooms.get(roomId);
					if (clients) {
						for (const clientId of clients) {
							io.sockets.sockets.get(clientId)?.leave(roomId);
						}
					}
				}, 2 * 60 * 1000); // 2 minutes timeout

				hostDisconnectTimeouts.set(roomId, timeout);
			}
		}
	});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`Socket.io server running on port ${PORT}`);
});
