// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";

const httpServer = http.createServer((req, res) => {
	// Healthcheck
	if (req.method === "GET" && req.url === "/") {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("Socket server is running");
		return; // 👈 IMPORTANT
	}

	// Let Engine.IO/Socket.IO handle its own routes
	if (req.url?.startsWith("/socket.io")) {
		return; // 👈 Do NOT send 404 here
	}

	// Everything else
	res.writeHead(404);
	res.end();
});

httpServer.on("error", (err) => console.error("🚨 HTTP server error:", err));

const allowedOrigins = [
	"http://localhost:3000", // local dev
	"https://guess-the-song-topaz-ten.vercel.app", // preview on Vercel
	"https://guess-the-song.vercel.app", // production on Vercel
];

const io = new Server(httpServer, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: false, // only set true if you actually use cookies/auth
	},
	transports: ["polling", "websocket"],
	path: "/socket.io",
	// 1) Ping every 20 sec
	pingInterval: 20_000,
	// 2) If no pong within 5 sec, time‐out
	pingTimeout: 5_000,
});

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
	registerSocketHandlers(io, socket);
});

const PORT = Number(process.env.PORT ?? process.env.SOCKET_PORT ?? 4000);
httpServer.listen(PORT, () => {
	console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
