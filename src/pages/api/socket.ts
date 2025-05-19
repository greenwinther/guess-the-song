//src/pages/api/socket.ts
import type { NextApiRequest } from "next";
import type { NextApiResponseWithSocket } from "@/types/socket";
import { Server as IOServer } from "socket.io";
import { Server as NetServer } from "http";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
	if (!res.socket.server.io) {
		console.log("Setting up Socket.io server...");
		const httpServer: NetServer = res.socket.server;
		const io = new IOServer(httpServer, {
			path: "/api/socket",
		});

		io.on("connection", (socket) => {
			console.log("New client connected", socket.id);
			socket.on("message", (msg) => {
				console.log("Received message:", msg);
				io.emit("message", msg);
			});
		});

		res.socket.server.io = io;
	} else {
		console.log("Socket.io server already running");
	}
	res.end();
}
