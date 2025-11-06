// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";
import { startCleanupScheduler } from "./cleanupScheduler";

const httpServer = http.createServer((req, res) => {
	if (req.url === "/" && req.method === "GET") {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("Socket server is running");
	} else {
		res.writeHead(404);
		res.end();
	}
});

// 1) Log any HTTP-level server errors
httpServer.on("error", (err) => {
	console.error("🚨 HTTP server error:", err);
});

const allowedOrigins = [
	process.env.CLIENT_URL || "http://localhost:3000",
	process.env.CLIENT_URL_2, // e.g. preview URL
].filter(Boolean) as string[];

export const io = new Server(httpServer, {
	// Serve only WS, not the bundled client
	serveClient: false,
	transports: ["websocket"],

	// If you deploy behind a reverse proxy, consider a custom path:
	// path: process.env.SOCKET_PATH || "/socket.io",

	cors: {
		origin: allowedOrigins,
		credentials: true,
		methods: ["GET", "POST"],
	},

	// Connection liveness (a lite more forgiving than 5s)
	pingInterval: 20_000,
	pingTimeout: 15_000,

	connectionStateRecovery: {
		maxDisconnectionDuration: 120_000, // 2 min
	},
});

// 2) Log Engine.IO connection-level errors
io.engine.on("connection_error", (err) => {
	console.error("🚨 Engine.IO connection error:", err);
});

// 3) Log top-level Socket.IO errors
io.of("/").on("connect_error", (err) => {
	console.error("🚨 Socket.IO connect_error:", err);
});

io.on("connection", (socket) => {
	console.log("↔️ socket connected", socket.id);

	socket.on("error", (err) => {
		console.error(`🚨 Socket ${socket.id} error:`, err);
	});

	registerSocketHandlers(io, socket);
});

const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
	startCleanupScheduler(io);
});

// Graceful shutdown (Railway/Node best practice)
process.on("SIGTERM", () => {
	console.log("🧹 SIGTERM received, closing server...");
	io.close(() => {
		httpServer.close(() => {
			console.log("✅ Closed Socket.IO and HTTP server");
			process.exit(0);
		});
	});
});
