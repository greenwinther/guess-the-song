"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const createRoomHandler = (io, socket) => {
    socket.on("createRoom", async (data, callback) => {
        try {
            const { theme, backgroundUrl, hostName } = data;
            const newRoom = await (0, rooms_1.createRoom)(theme, backgroundUrl || null, hostName);
            socket.join(newRoom.code);
            // Optionally store socket.id of host if you want later control
            callback({
                code: newRoom.code,
                theme: newRoom.theme,
                backgroundUrl: newRoom.backgroundUrl || undefined,
                hostName, // return this if needed on client
            });
            io.to(newRoom.code).emit("roomData", newRoom); // includes host in players
        }
        catch (err) {
            console.error(err);
            socket.emit("error", err.message);
        }
    });
};
exports.createRoomHandler = createRoomHandler;
