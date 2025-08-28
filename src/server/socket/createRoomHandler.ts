// src/server/socket/createRoomHandler.ts
import { Server, Socket } from "socket.io";
import { createRoom } from "../../lib/rooms";

export const createRoomHandler = (io: Server, socket: Socket) => {
	socket.on("createRoom", async (data, callback) => {
		try {
			const { theme, backgroundUrl, hostName } = data;

			const newRoom = await createRoom(theme, backgroundUrl || null, hostName);

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
