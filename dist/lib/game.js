"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeRounds = void 0;
exports.getRoundsForCode = getRoundsForCode;
exports.startRoundData = startRoundData;
exports.storeOrder = storeOrder;
exports.storeDetailOrder = storeDetailOrder;
exports.manualLock = manualLock;
exports.tryUndoManualLock = tryUndoManualLock;
exports.tryUndoDetailLock = tryUndoDetailLock;
exports.manualDetailLock = manualDetailLock;
exports.lockCounts = lockCounts;
exports.detailLockCounts = detailLockCounts;
exports.getLockedPlayers = getLockedPlayers;
exports.getDetailLockedPlayers = getDetailLockedPlayers;
exports.finalizeSongForPlayers = finalizeSongForPlayers;
exports.finalizeDetailForPlayers = finalizeDetailForPlayers;
exports.clearRoomRounds = clearRoomRounds;
exports.removePlayerFromRounds = removePlayerFromRounds;
exports.exportRoundsState = exportRoundsState;
exports.importRoundsState = importRoundsState;
// src/lib/game.ts
const saveBus_1 = require("../server/state/saveBus");
const HARDCORE_UNDO_MS = 2000;
// In-memory map: roomCode → songId → RoundData
const rounds = {};
exports.activeRounds = rounds;
function getRoundsForCode(code) {
    var _a;
    return (_a = rounds[code]) !== null && _a !== void 0 ? _a : {};
}
// --- Setup ---
function startRoundData(code, songId, correctAnswer, submitters, detail) {
    if (!rounds[code])
        rounds[code] = {};
    rounds[code][songId] = {
        correctAnswer,
        orders: {},
        submitters,
        locks: {}, // 👈 init
        detailCorrectAnswer: detail === null || detail === void 0 ? void 0 : detail.correctAnswer,
        detailAnswers: detail === null || detail === void 0 ? void 0 : detail.answers,
        detailOrders: detail ? {} : undefined,
        detailLocks: detail ? {} : undefined,
    };
    (0, saveBus_1.notifyStateChange)();
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
    (0, saveBus_1.notifyStateChange)();
}
function storeDetailOrder(code, songId, playerName, order) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailOrders || !rd.detailLocks)
        return;
    const li = rd.detailLocks[playerName];
    if (li === null || li === void 0 ? void 0 : li.locked)
        return;
    rd.detailOrders[playerName] = order;
    (0, saveBus_1.notifyStateChange)();
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
    (0, saveBus_1.notifyStateChange)();
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
    (0, saveBus_1.notifyStateChange)();
    return true;
}
function tryUndoDetailLock(code, songId, playerName) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailLocks)
        return false;
    const li = rd.detailLocks[playerName];
    if (!(li === null || li === void 0 ? void 0 : li.locked) || li.method !== "manual" || !li.lockedAt)
        return false;
    if (Date.now() - li.lockedAt > HARDCORE_UNDO_MS)
        return false;
    rd.detailLocks[playerName] = { locked: false };
    (0, saveBus_1.notifyStateChange)();
    return true;
}
function manualDetailLock(code, songId, playerName) {
    var _a, _b, _c;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailOrders || !rd.detailLocks)
        return false;
    const li = (_b = rd.detailLocks[playerName]) !== null && _b !== void 0 ? _b : { locked: false };
    if (li.locked)
        return false;
    rd.detailOrders[playerName] = (_c = rd.detailOrders[playerName]) !== null && _c !== void 0 ? _c : [];
    rd.detailLocks[playerName] = { locked: true, lockedAt: Date.now(), method: "manual" };
    (0, saveBus_1.notifyStateChange)();
    return true;
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
function detailLockCounts(code, songId) {
    var _a;
    const rd = (_a = rounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailLocks || !rd.detailOrders)
        return { locked: 0, total: 0 };
    const total = new Set([
        ...Object.keys(rd.detailOrders),
        ...Object.keys(rd.detailLocks),
    ]).size;
    const locked = Object.values(rd.detailLocks).filter((x) => x.locked).length;
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
function getDetailLockedPlayers(code, songId) {
    var _a;
    const rd = (_a = exports.activeRounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailLocks)
        return [];
    return Object.entries(rd.detailLocks)
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
    (0, saveBus_1.notifyStateChange)();
    return { locked, total: playerNames.length };
}
function finalizeDetailForPlayers(code, songId, playerNames) {
    var _a, _b, _c, _d, _e;
    const rd = (_a = exports.activeRounds[code]) === null || _a === void 0 ? void 0 : _a[songId];
    if (!rd || !rd.detailOrders || !rd.detailLocks)
        return { locked: 0, total: playerNames.length };
    let locked = 0;
    for (const name of playerNames) {
        const already = (_c = (_b = rd.detailLocks) === null || _b === void 0 ? void 0 : _b[name]) === null || _c === void 0 ? void 0 : _c.locked;
        if (!already) {
            rd.detailOrders[name] = (_d = rd.detailOrders[name]) !== null && _d !== void 0 ? _d : [];
            rd.detailLocks[name] = { locked: true, lockedAt: Date.now(), method: "auto" };
        }
        if ((_e = rd.detailLocks[name]) === null || _e === void 0 ? void 0 : _e.locked)
            locked++;
    }
    (0, saveBus_1.notifyStateChange)();
    return { locked, total: playerNames.length };
}
function clearRoomRounds(code) {
    delete rounds[code];
    (0, saveBus_1.notifyStateChange)();
}
function removePlayerFromRounds(code, playerName) {
    const bySong = rounds[code];
    if (!bySong)
        return;
    for (const data of Object.values(bySong)) {
        delete data.orders[playerName];
        delete data.locks[playerName];
    }
    (0, saveBus_1.notifyStateChange)();
}
function exportRoundsState() {
    const snapshot = {};
    for (const [code, bySong] of Object.entries(rounds)) {
        snapshot[code] = {};
        for (const [songId, data] of Object.entries(bySong)) {
            const numericId = Number(songId);
            snapshot[code][numericId] = {
                correctAnswer: data.correctAnswer,
                orders: Object.assign({}, data.orders),
                submitters: [...data.submitters],
                locks: Object.assign({}, data.locks),
                detailCorrectAnswer: data.detailCorrectAnswer,
                detailAnswers: data.detailAnswers ? [...data.detailAnswers] : undefined,
                detailOrders: data.detailOrders ? Object.assign({}, data.detailOrders) : undefined,
                detailLocks: data.detailLocks ? Object.assign({}, data.detailLocks) : undefined,
            };
        }
    }
    return snapshot;
}
function importRoundsState(snapshot) {
    var _a, _b, _c, _d, _e;
    for (const key of Object.keys(rounds))
        delete rounds[key];
    if (!snapshot)
        return;
    for (const [code, bySong] of Object.entries(snapshot)) {
        rounds[code] = {};
        for (const [songId, data] of Object.entries(bySong)) {
            const numericId = Number(songId);
            rounds[code][numericId] = {
                correctAnswer: (_a = data.correctAnswer) !== null && _a !== void 0 ? _a : "",
                orders: (_b = data.orders) !== null && _b !== void 0 ? _b : {},
                submitters: Array.isArray(data.submitters) ? data.submitters : [],
                locks: (_c = data.locks) !== null && _c !== void 0 ? _c : {},
                detailCorrectAnswer: data.detailCorrectAnswer,
                detailAnswers: Array.isArray(data.detailAnswers) ? data.detailAnswers : undefined,
                detailOrders: (_d = data.detailOrders) !== null && _d !== void 0 ? _d : undefined,
                detailLocks: (_e = data.detailLocks) !== null && _e !== void 0 ? _e : undefined,
            };
        }
    }
}
