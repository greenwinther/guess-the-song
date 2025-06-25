import { createRoom, getRoom } from "@/lib/rooms";
export const createRoomHandler = (io, socket) => {
    socket.on("createRoom", async (data, callback) => {
        try {
            const newRoom = await createRoom(data.theme, data.backgroundUrl || null);
            socket.join(newRoom.code);
            callback({
                code: newRoom.code,
                theme: newRoom.theme,
                backgroundUrl: newRoom.backgroundUrl || undefined,
            });
            const fullRoom = await getRoom(newRoom.code);
            io.to(newRoom.code).emit("roomData", fullRoom);
        }
        catch (err) {
            console.error(err);
            socket.emit("error", err.message);
        }
    });
};
