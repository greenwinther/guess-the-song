//src/types/socket.d.ts
import type { NextApiResponse } from "next";
import type { Socket } from "net";
import type { Server as NetServer } from "http";
import type { Server as IOServer } from "socket.io";

export interface NextApiResponseWithSocket extends NextApiResponse {
	socket: Socket & {
		server: NetServer & {
			io?: IOServer;
		};
	};
}
