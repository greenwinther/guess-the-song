"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/socketServer.ts
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
const httpServer = http_1.default.createServer((req, res) => {
    var _a;
    // Healthcheck
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Socket server is running");
        return; // 👈 IMPORTANT
    }
    // Debug: prove polling/WS requests reach the server
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/socket.io")) {
        console.log("📥 incoming socket.io request:", req.method, req.url);
        return; // let Engine.IO handle it
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
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: false, // only set true if you actually use cookies/auth
    },
    transports: ["polling", "websocket"],
    path: "/socket.io",
    // 1) Ping every 20 sec
    pingInterval: 20000,
    // 2) If no pong within 5 sec, time‐out
    pingTimeout: 5000,
});
// Extra Engine.IO debug hooks
io.engine.on("initial_headers", (_headers, req) => {
    var _a;
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.includes("/socket.io")) {
        console.log("🧩 initial_headers for", req.url);
    }
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
const PORT = Number((_b = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : process.env.SOCKET_PORT) !== null && _b !== void 0 ? _b : 4000);
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
