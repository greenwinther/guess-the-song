// src/server/socketServer.ts
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket";
const httpServer = http.createServer((req, res) => {
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
const io = new Server(httpServer, {
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
    registerSocketHandlers(io, socket);
});
const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server listening on port ${PORT}`);
});
