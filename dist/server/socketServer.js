"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/socketServer.ts
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
const cleanupScheduler_1 = require("./cleanupScheduler");
const persistence_1 = require("./state/persistence");
const registerHttpRoutes_1 = require("./http/registerHttpRoutes");
dotenv_1.default.config({ path: ".env.local", quiet: true });
dotenv_1.default.config({ quiet: true });
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.CLIENT_URL_2,
].filter(Boolean);
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use(express_1.default.json({ limit: "1mb" }));
app.use((req, res, next) => {
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
(0, registerHttpRoutes_1.registerHttpRoutes)(app);
const httpServer = http_1.default.createServer(app);
httpServer.on("error", (err) => {
    console.error("HTTP server error:", err);
});
const io = new socket_io_1.Server(httpServer, {
    serveClient: false,
    transports: ["websocket"],
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"],
    },
    pingInterval: 20000,
    pingTimeout: 15000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 120000,
    },
});
const persistence = (0, persistence_1.initStatePersistence)();
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
    (0, socket_1.registerSocketHandlers)(io, socket);
});
const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
    console.log(`Socket.IO + Express server listening on port ${PORT}`);
    (0, cleanupScheduler_1.startCleanupScheduler)(io);
});
const shutdown = (signal) => {
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
