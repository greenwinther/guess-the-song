"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/socketServer.ts
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
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
// 1) Log any HTTP‐level server errors (e.g. EADDRINUSE, etc.)
httpServer.on("error", (err) => {
    console.error("🚨 HTTP server error:", err);
});
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:3000" },
    // 1) Ping every 20 sec
    pingInterval: 20000,
    // 2) If no pong within 5 sec, time‐out
    pingTimeout: 5000,
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
    (0, socket_1.registerSocketHandlers)(io, socket);
});
const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
