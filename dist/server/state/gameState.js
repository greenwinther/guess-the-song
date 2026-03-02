"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomGameState = getRoomGameState;
exports.setActiveSong = setActiveSong;
exports.setRevealedSongs = setRevealedSongs;
exports.addRevealedSong = addRevealedSong;
exports.setFinalScores = setFinalScores;
exports.setGameStarted = setGameStarted;
exports.clearRoomGameState = clearRoomGameState;
exports.exportGameState = exportGameState;
exports.importGameState = importGameState;
const saveBus_1 = require("./saveBus");
const byRoom = new Map();
const defaultState = () => ({
    activeSongId: null,
    revealedSongs: [],
    finalScores: null,
    gameStarted: false,
});
function getRoomGameState(code) {
    const key = code.toUpperCase();
    const existing = byRoom.get(key);
    if (existing)
        return existing;
    const created = defaultState();
    byRoom.set(key, created);
    return created;
}
function setActiveSong(code, songId) {
    const s = getRoomGameState(code);
    s.activeSongId = songId;
    (0, saveBus_1.notifyStateChange)();
    return s;
}
function setRevealedSongs(code, ids) {
    const s = getRoomGameState(code);
    s.revealedSongs = ids;
    (0, saveBus_1.notifyStateChange)();
    return s;
}
function addRevealedSong(code, songId) {
    const s = getRoomGameState(code);
    if (!s.revealedSongs.includes(songId))
        s.revealedSongs.push(songId);
    (0, saveBus_1.notifyStateChange)();
    return s;
}
function setFinalScores(code, scores) {
    const s = getRoomGameState(code);
    s.finalScores = scores;
    (0, saveBus_1.notifyStateChange)();
    return s;
}
function setGameStarted(code, started) {
    const s = getRoomGameState(code);
    s.gameStarted = started;
    (0, saveBus_1.notifyStateChange)();
    return s;
}
function clearRoomGameState(code) {
    byRoom.delete(code.toUpperCase());
    (0, saveBus_1.notifyStateChange)();
}
function exportGameState() {
    const snapshot = {};
    for (const [code, state] of byRoom.entries()) {
        snapshot[code] = {
            activeSongId: state.activeSongId,
            revealedSongs: [...state.revealedSongs],
            finalScores: state.finalScores ? Object.assign({}, state.finalScores) : null,
            gameStarted: state.gameStarted,
        };
    }
    return snapshot;
}
function importGameState(snapshot) {
    var _a;
    byRoom.clear();
    if (!snapshot)
        return;
    for (const [code, state] of Object.entries(snapshot)) {
        byRoom.set(code.toUpperCase(), {
            activeSongId: (_a = state.activeSongId) !== null && _a !== void 0 ? _a : null,
            revealedSongs: Array.isArray(state.revealedSongs) ? [...state.revealedSongs] : [],
            finalScores: state.finalScores ? Object.assign({}, state.finalScores) : null,
            gameStarted: !!state.gameStarted,
        });
    }
}
