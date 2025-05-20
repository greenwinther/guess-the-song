//src/server/socketServer.ts
import { Room, Song, GamePhase } from "@/types/game";
import { HostCreateRoomPayload } from "@/types/socket";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const rooms: Map<string, Room> = new Map();
const hostDisconnectTimeouts = new Map<string, NodeJS.Timeout>();

const httpServer = createServer();
const io = new Server(httpServer, {
	path: "/api/socket", // Wrong path I
});

io.on("connection", (socket: Socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on("host:createRoom", (payload: HostCreateRoomPayload) => {
		const { roomId, songs } = payload;

		if (rooms.has(roomId)) {
			socket.emit("error", `Room ${roomId} already exists`);
			return;
		}

		const newRoom: Room = {
			roomId,
			hostId: socket.id,
			songs,
			players: [],
			currentPhase: "lobby",
			currentSongIndex: 0,
			guesses: {},
			scores: {},
		};

		rooms.set(roomId, newRoom);
		socket.join(roomId);

		console.log(`Host created room ${roomId} with socket ${socket.id}`);
	});

	socket.on("startGame", ({ roomId }) => {
		io.to(roomId).emit("gameStarted");
	});

	socket.on("host:rejoinRoom", ({ roomId }: { roomId: string }) => {
		const room = rooms.get(roomId);
		if (!room) {
			socket.emit("error", "Room not found");
			return;
		}

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
				}, 2 * 60 * 1000);

				hostDisconnectTimeouts.set(roomId, timeout);
			}
		}
	});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`Socket.io server running on port ${PORT}`);
});
