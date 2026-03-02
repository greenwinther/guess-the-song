"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const validation_1 = require("../validation");
const publicRoom_1 = require("../state/publicRoom");
const createRoomHandler = (io, socket) => {
    socket.on("createRoom", async (data, callback) => {
        var _a, _b, _c;
        try {
            const theme = (_a = (0, validation_1.parseOptionalText)(data.theme)) !== null && _a !== void 0 ? _a : "";
            const backgroundUrl = (0, validation_1.parseOptionalUrl)(data.backgroundUrl);
            const hostName = (0, validation_1.parseName)(data.hostName, "Host");
            const avatar = (_b = (0, validation_1.parseAvatarConfig)(data.avatar)) !== null && _b !== void 0 ? _b : undefined;
            const newRoom = await (0, rooms_1.createRoom)(theme, backgroundUrl, hostName, avatar);
            socket.join(newRoom.code);
            // Optionally store socket.id of host if you want later control
            callback({
                code: newRoom.code,
                theme: newRoom.theme,
                backgroundUrl: newRoom.backgroundUrl || undefined,
                hostName, // return this if needed on client
            });
            io.to(newRoom.code).emit("roomData", (0, publicRoom_1.toPublicRoom)(newRoom)); // includes host in players
        }
        catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Unknown error";
            callback({
                code: "",
                theme: null,
                backgroundUrl: undefined,
                hostName: (_c = data === null || data === void 0 ? void 0 : data.hostName) !== null && _c !== void 0 ? _c : "Host",
                error: message,
            });
        }
    });
};
exports.createRoomHandler = createRoomHandler;
