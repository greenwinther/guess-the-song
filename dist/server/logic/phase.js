"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPhase = isPhase;
function isPhase(room, phase) {
    var _a;
    const list = Array.isArray(phase) ? phase : [phase];
    return list.includes((_a = room.phase) !== null && _a !== void 0 ? _a : "LOBBY");
}
