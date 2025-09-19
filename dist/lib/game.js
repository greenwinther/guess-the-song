"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeRounds = void 0;
exports.startRoundData = startRoundData;
exports.storeOrder = storeOrder;
exports.manualLock = manualLock;
exports.tryUndoManualLock = tryUndoManualLock;
exports.finalizeSongForAll = finalizeSongForAll;
exports.lockCounts = lockCounts;
exports.getLockedPlayers = getLockedPlayers;
exports.finalizeSongForPlayers = finalizeSongForPlayers;
exports.computeScores = computeScores;
const HARDCORE_UNDO_MS = 2000;
// In-memory map: roomCode → songId → RoundData
const rounds = {};
exports.activeRounds = rounds;
// --- Setup ---
function startRoundData(code, songId, correctAnswer, submitters) {
    if (!rounds[code])
        rounds[code] = {};
    rounds[code][songId] = {
        correctAnswer,
        orders: {},
        submitters,
        locks: {}, // 👈 init
    };
}
// --- Selection updates (does NOT lock) ---
function storeOrder(code, songId, playerName, order) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return;
    const li = rd.locks[playerName];
    if (li === null || li === void 0 ? void 0 : li.locked)
        return; // ignore edits after lock
    rd.orders[playerName] = order;
}
// --- Manual lock (from "Lock answer" button) ---
function manualLock(code, songId, playerName) {
    var _a, _b, _c;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return false;
    const li = (_b = rd.locks[playerName]) !== null && _b !== void 0 ? _b : { locked: false };
    if (li.locked)
        return false;
    // Ensure at least an order exists; if not, count as "no answer"
    rd.orders[playerName] = (_c = rd.orders[playerName]) !== null && _c !== void 0 ? _c : [];
    rd.locks[playerName] = {
        locked: true,
        lockedAt: Date.now(),
        method: "manual",
    };
    return true;
}
// --- Optional tiny undo window (2s) for manual locks ---
function tryUndoManualLock(code, songId, playerName) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return false;
    const li = rd.locks[playerName];
    if (!(li === null || li === void 0 ? void 0 : li.locked) || li.method !== "manual" || !li.lockedAt)
        return false;
    if (Date.now() - li.lockedAt > HARDCORE_UNDO_MS)
        return false;
    // Just revert the lock; keep the order intact so the player can tweak again
    rd.locks[playerName] = { locked: false };
    return true;
}
// --- Auto-finalize (called on host "Next song") ---
function finalizeSongForAll(code, songId) {
    var _a, _b, _c;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return { locked: 0, total: 0 };
    let locked = 0;
    const playerNames = new Set([...Object.keys(rd.orders), ...Object.keys(rd.locks)]);
    for (const name of playerNames) {
        const li = (_b = rd.locks[name]) !== null && _b !== void 0 ? _b : { locked: false };
        if (!li.locked) {
            // Lock whatever selection exists now (or [] = "no answer")
            rd.orders[name] = (_c = rd.orders[name]) !== null && _c !== void 0 ? _c : [];
            rd.locks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
        }
        if (rd.locks[name].locked)
            locked++;
    }
    return { locked, total: playerNames.size };
}
// --- Helpers to power the host UI counters ---
function lockCounts(code, songId) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return { locked: 0, total: 0 };
    const total = new Set([...Object.keys(rd.orders), ...Object.keys(rd.locks)]).size;
    const locked = Object.values(rd.locks).filter((x) => x.locked).length;
    return { locked, total };
}
// lib/game.ts
function getLockedPlayers(code, songId) {
    var _a;
    const rd = (_a = exports.activeRounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return [];
    return Object.entries(rd.locks)
        .filter(([, li]) => li.locked)
        .map(([name]) => name);
}
// Lock only specific players for a given song (auto lock)
function finalizeSongForPlayers(code, songId, playerNames) {
    var _a, _b, _c, _d, _e;
    const rd = (_a = exports.activeRounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd)
        return { locked: 0, total: playerNames.length };
    let locked = 0;
    for (const name of playerNames) {
        const already = (_c = (_b = rd.locks) === null || _b === void 0 ? void 0 : _b[name]) === null || _c === void 0 ? void 0 : _c.locked;
        if (!already) {
            rd.orders[name] = (_d = rd.orders[name]) !== null && _d !== void 0 ? _d : []; // empty = no guess
            rd.locks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
        }
        if ((_e = rd.locks[name]) === null || _e === void 0 ? void 0 : _e.locked)
            locked++;
    }
    return { locked, total: playerNames.length };
}
// --- Your existing scoring stays identical ---
function computeScores(allOrders, correctAnswer) {
    const scores = {};
    for (const [player, order] of Object.entries(allOrders)) {
        scores[player] = order[0] === correctAnswer ? 1 : 0;
    }
    return scores;
}
