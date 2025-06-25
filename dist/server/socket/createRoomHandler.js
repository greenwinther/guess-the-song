"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomHandler = void 0;
const rooms_1 = require("@/lib/rooms");
const createRoomHandler = (io, socket) => {
    socket.on("createRoom", async (data, callback) => {
        try {
            const newRoom = await (0, rooms_1.createRoom)(data.theme, data.backgroundUrl || null);
            socket.join(newRoom.code);
            callback({
                code: newRoom.code,
                theme: newRoom.theme,
                backgroundUrl: newRoom.backgroundUrl || undefined,
            });
            const fullRoom = await (0, rooms_1.getRoom)(newRoom.code);
            io.to(newRoom.code).emit("roomData", fullRoom);
        }
        catch (err) {
            console.error(err);
            socket.emit("error", err.message);
        }
    });
};
exports.createRoomHandler = createRoomHandler;
