// src/server/socket/createRoomHandler.ts
import { Server, Socket } from "socket.io";
import { createRoom } from "../../lib/rooms";

type CreateRoomPayload = {
	theme?: string;
	backgroundUrl?: string | null;
	hostName: string;
};

type CreateRoomResponse = {
	code: string;
	theme?: string | null;
	backgroundUrl?: string;
	hostName: string;
};

export const createRoomHandler = (io: Server, socket: Socket) => {
	socket.on("createRoom", async (data: CreateRoomPayload, callback: (resp: CreateRoomResponse) => void) => {
		try {
			const theme = data.theme?.trim() ?? "";
			const backgroundUrl = data.backgroundUrl ?? null;
			const hostName = data.hostName?.trim() || "Host";

			const newRoom = await createRoom(theme, backgroundUrl, hostName);

			socket.join(newRoom.code);

			// Optionally store socket.id of host if you want later control

			callback({
				code: newRoom.code,
				theme: newRoom.theme,
				backgroundUrl: newRoom.backgroundUrl || undefined,
				hostName, // return this if needed on client
			});

			io.to(newRoom.code).emit("roomData", newRoom); // includes host in players
		} catch (err: any) {
			console.error(err);
			socket.emit("error", err.message);
		}
	});
};
