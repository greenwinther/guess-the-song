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
import { scopedLogger } from "./logger";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
const log = scopedLogger("socketServer");

const allowedOrigins = [
	process.env.CLIENT_URL || "http://localhost:3000",
	process.env.CLIENT_URL_2,
].filter(Boolean) as string[];

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((req: Request, res: Response, next: NextFunction) => {
	const started = Date.now();
	res.on("finish", () => {
		log.debug(
			{
				method: req.method,
				url: req.originalUrl || req.url,
				statusCode: res.statusCode,
				durationMs: Date.now() - started,
			},
			"http request"
		);
	});
	next();
});

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
	log.error({ err }, "HTTP server error");
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
	log.error({ err }, "Engine.IO connection error");
});

io.of("/").on("connect_error", (err) => {
	log.error({ err }, "Socket.IO connect_error");
});

io.on("connection", (socket) => {
	log.info({ socketId: socket.id }, "socket connected");

	socket.on("error", (err) => {
		log.error({ err, socketId: socket.id }, "socket error");
	});

	registerSocketHandlers(io, socket);
});

const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
	log.info({ port: PORT }, "Socket.IO + Express server listening");
	startCleanupScheduler(io);
});

const shutdown = (signal: string) => {
	log.info({ signal }, "shutdown signal received");
	persistence.flush();
	io.close(() => {
		httpServer.close(() => {
			log.info("Closed Socket.IO, Express, and HTTP server");
			process.exit(0);
		});
	});
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
