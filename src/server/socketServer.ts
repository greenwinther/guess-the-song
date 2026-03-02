// src/server/socketServer.ts
import http from "http";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";
import { startCleanupScheduler } from "./cleanupScheduler";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { initStatePersistence } from "./state/persistence";
import { registerHttpRoutes } from "./http/registerHttpRoutes";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const allowedOrigins = [
	process.env.CLIENT_URL || "http://localhost:3000",
	process.env.CLIENT_URL_2,
].filter(Boolean) as string[];

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
	const origin = req.headers.origin;
	const allow = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

	if (allow && origin) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Vary", "Origin");
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	}

	if (req.method === "OPTIONS") {
		res.sendStatus(allow ? 204 : 403);
		return;
	}

	next();
});

registerHttpRoutes(app);

const httpServer = http.createServer(app);

httpServer.on("error", (err) => {
	console.error("HTTP server error:", err);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
	httpServer,
	{
		serveClient: false,
		transports: ["websocket"],
		cors: {
			origin: allowedOrigins,
			credentials: true,
			methods: ["GET", "POST"],
		},
		pingInterval: 20_000,
		pingTimeout: 15_000,
		connectionStateRecovery: {
			maxDisconnectionDuration: 120_000,
		},
	}
);

const persistence = initStatePersistence();

io.engine.on("connection_error", (err) => {
	console.error("Engine.IO connection error:", err);
});

io.of("/").on("connect_error", (err) => {
	console.error("Socket.IO connect_error:", err);
});

io.on("connection", (socket) => {
	console.log("socket connected", socket.id);

	socket.on("error", (err) => {
		console.error(`Socket ${socket.id} error:`, err);
	});

	registerSocketHandlers(io, socket);
});

const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
	console.log(`Socket.IO + Express server listening on port ${PORT}`);
	startCleanupScheduler(io);
});

const shutdown = (signal: string) => {
	console.log(`${signal} received, closing server...`);
	persistence.flush();
	io.close(() => {
		httpServer.close(() => {
			console.log("Closed Socket.IO, Express, and HTTP server");
			process.exit(0);
		});
	});
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
