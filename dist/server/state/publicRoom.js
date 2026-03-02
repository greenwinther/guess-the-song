"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicRoom = toPublicRoom;
function toPublicRoom(room) {
    var _a;
    return {
        id: room.id,
        code: room.code,
        phase: room.phase,
        theme: room.theme,
        detailQuestion: room.detailQuestion,
        backgroundUrl: (_a = room.backgroundUrl) !== null && _a !== void 0 ? _a : null,
        hardcoreRequired: room.rules.hardcoreRequired,
        players: room.players.map((p) => (Object.assign({}, p))),
        songs: room.songs.map((s) => (Object.assign({}, s))),
    };
}
