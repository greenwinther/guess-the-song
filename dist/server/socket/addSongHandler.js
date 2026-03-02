"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSongHandler = void 0;
const rooms_1 = require("../../lib/rooms");
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const phase_1 = require("../logic/phase");
const youtube_1 = require("../../lib/youtube");
const addSongHandler = (io, socket) => {
    socket.on("addSong", async (data, callback) => {
        var _a;
        try {
            const code = (0, validation_1.parseRoomCode)(data.code);
            if (!code)
                return callback({ success: false, error: "Invalid room code" });
            const url = (0, validation_1.parseRequiredUrl)(data.url);
            if (!url)
                return callback({ success: false, error: "Invalid URL" });
            const submitter = (0, validation_1.parseName)(data.submitter, "Player");
            const title = (_a = (0, validation_1.parseOptionalText)(data.title)) !== null && _a !== void 0 ? _a : "";
            const detailAnswer = (0, validation_1.parseOptionalText)(data.detailAnswer);
            const room = (0, guards_1.requireRoom)(socket, () => callback({ success: false, error: "No room" }));
            if (!room || room.code !== code)
                return;
            if (!(0, guards_1.requireHost)(socket, room, () => callback({ success: false, error: "Not host" })))
                return;
            if (!(0, phase_1.isPhase)(room, "LOBBY")) {
                return callback({ success: false, error: "Room not in lobby" });
            }
            const incomingId = (0, youtube_1.getYouTubeID)(url);
            if (incomingId) {
                const full = await (0, rooms_1.getRoom)(code);
                const existing = full.songs.find((s) => (0, youtube_1.getYouTubeID)(s.url) === incomingId);
                if (existing) {
                    return callback({ success: false, error: "Duplicate song" });
                }
            }
            const song = await (0, rooms_1.addSong)(code, {
                url,
                submitter,
                title,
                detailAnswer: detailAnswer !== null && detailAnswer !== void 0 ? detailAnswer : undefined,
            });
            const withTitle = Object.assign(Object.assign({}, song), { title });
            console.log("[server] emitting songAdded:", song);
            // Broadcast just the new song
            io.to(code).emit("songAdded", withTitle);
            callback({ success: true, song: withTitle });
        }
        catch (err) {
            console.error("[server] addSong error", err);
            const message = err instanceof Error ? err.message : "Unknown error";
            callback({ success: false, error: message });
        }
    });
};
exports.addSongHandler = addSongHandler;
