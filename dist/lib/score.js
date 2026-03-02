"use strict";
// Minimal in-memory scoreboard keyed by room code + player name.
// If you later move scores to DB, keep the same function signature.
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPointsByCodeName = addPointsByCodeName;
exports.getRoomScores = getRoomScores;
exports.clearRoomScores = clearRoomScores;
exports.removePlayerScore = removePlayerScore;
const scoresByCode = {};
function addPointsByCodeName(code, playerName, delta) {
    var _a;
    if (!scoresByCode[code])
        scoresByCode[code] = {};
    const prev = (_a = scoresByCode[code][playerName]) !== null && _a !== void 0 ? _a : 0;
    const next = prev + delta;
    scoresByCode[code][playerName] = next;
    return next;
}
// Optional: get whole board for a room if you need it elsewhere
function getRoomScores(code) {
    var _a;
    return (_a = scoresByCode[code]) !== null && _a !== void 0 ? _a : {};
}
function clearRoomScores(code) {
    delete scoresByCode[code];
}
function removePlayerScore(code, playerName) {
    if (!scoresByCode[code])
        return;
    delete scoresByCode[code][playerName];
}
