"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const createRoomHandler = (io, socket) => {
    socket.on("createRoom", async (data, callback) => {
        var _a, _b, _c, _d;
        try {
            const theme = (_b = (_a = data.theme) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
            const backgroundUrl = (_c = data.backgroundUrl) !== null && _c !== void 0 ? _c : null;
            const hostName = ((_d = data.hostName) === null || _d === void 0 ? void 0 : _d.trim()) || "Host";
            const newRoom = await (0, rooms_1.createRoom)(theme, backgroundUrl, hostName);
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
