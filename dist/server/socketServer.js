"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// src/server/socketServer.ts
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
const cleanupScheduler_1 = require("./cleanupScheduler");
const httpServer = http_1.default.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Socket server is running");
    }
    else {
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
].filter(Boolean);
exports.io = new socket_io_1.Server(httpServer, {
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
    pingInterval: 20000,
    pingTimeout: 15000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 120000, // 2 min
    },
});
// 2) Log Engine.IO connection-level errors
exports.io.engine.on("connection_error", (err) => {
    console.error("🚨 Engine.IO connection error:", err);
});
// 3) Log top-level Socket.IO errors
exports.io.of("/").on("connect_error", (err) => {
    console.error("🚨 Socket.IO connect_error:", err);
});
exports.io.on("connection", (socket) => {
    console.log("↔️ socket connected", socket.id);
    socket.on("error", (err) => {
        console.error(`🚨 Socket ${socket.id} error:`, err);
    });
    (0, socket_1.registerSocketHandlers)(exports.io, socket);
});
const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server listening on port ${PORT}`);
    (0, cleanupScheduler_1.startCleanupScheduler)(exports.io);
});
// Graceful shutdown (Railway/Node best practice)
process.on("SIGTERM", () => {
    console.log("🧹 SIGTERM received, closing server...");
    exports.io.close(() => {
        httpServer.close(() => {
            console.log("✅ Closed Socket.IO and HTTP server");
            process.exit(0);
        });
    });
});
