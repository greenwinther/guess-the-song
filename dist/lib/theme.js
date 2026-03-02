"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initThemeState = initThemeState;
exports.resetForNewTheme = resetForNewTheme;
exports.lockPlayerThisRound = lockPlayerThisRound;
exports.hasLockedThisRound = hasLockedThisRound;
exports.clearRoundLocks = clearRoundLocks;
exports.markSolved = markSolved;
exports.alreadySolved = alreadySolved;
exports.getSolvedList = getSolvedList;
exports.setRevealed = setRevealed;
exports.isRevealed = isRevealed;
exports.setHint = setHint;
exports.getHint = getHint;
exports.clearThemeState = clearThemeState;
exports.removePlayerFromThemeState = removePlayerFromThemeState;
exports.getLockedThisRoundList = getLockedThisRoundList;
exports.exportThemeState = exportThemeState;
exports.importThemeState = importThemeState;
exports.obfuscateTheme = obfuscateTheme;
exports.normalize = normalize;
// Minimal in-memory helpers; keyed by room code (same as lib/game.ts style)
const saveBus_1 = require("@/server/state/saveBus");
const solvedBy = {}; // code -> Set(playerName)
const lockedThisRound = {}; // code -> Set(playerName)
const revealed = {}; // code -> revealed?
const hint = {}; // code -> obfuscated string
function initThemeState(code) {
    if (!solvedBy[code])
        solvedBy[code] = new Set();
    if (!lockedThisRound[code])
        lockedThisRound[code] = new Set();
    if (revealed[code] === undefined)
        revealed[code] = false;
    if (hint[code] === undefined)
        hint[code] = "";
}
function resetForNewTheme(code) {
    solvedBy[code] = new Set();
    lockedThisRound[code] = new Set();
    revealed[code] = false;
    hint[code] = "";
    (0, saveBus_1.notifyStateChange)();
}
function lockPlayerThisRound(code, playerName) {
    initThemeState(code);
    lockedThisRound[code].add(playerName);
    (0, saveBus_1.notifyStateChange)();
}
function hasLockedThisRound(code, playerName) {
    initThemeState(code);
    return lockedThisRound[code].has(playerName);
}
function clearRoundLocks(code) {
    initThemeState(code);
    lockedThisRound[code] = new Set();
    (0, saveBus_1.notifyStateChange)();
}
function markSolved(code, playerName) {
    initThemeState(code);
    solvedBy[code].add(playerName);
    (0, saveBus_1.notifyStateChange)();
}
function alreadySolved(code, playerName) {
    initThemeState(code);
    return solvedBy[code].has(playerName);
}
function getSolvedList(code) {
    initThemeState(code);
    return Array.from(solvedBy[code]);
}
function setRevealed(code, value) {
    initThemeState(code);
    revealed[code] = value;
    (0, saveBus_1.notifyStateChange)();
}
function isRevealed(code) {
    initThemeState(code);
    return revealed[code];
}
function setHint(code, value) {
    initThemeState(code);
    hint[code] = value;
    (0, saveBus_1.notifyStateChange)();
}
function getHint(code) {
    initThemeState(code);
    return hint[code];
}
function clearThemeState(code) {
    delete solvedBy[code];
    delete lockedThisRound[code];
    delete revealed[code];
    delete hint[code];
    (0, saveBus_1.notifyStateChange)();
}
function removePlayerFromThemeState(code, playerName) {
    initThemeState(code);
    solvedBy[code].delete(playerName);
    lockedThisRound[code].delete(playerName);
    (0, saveBus_1.notifyStateChange)();
}
function getLockedThisRoundList(code) {
    initThemeState(code);
    return Array.from(lockedThisRound[code]);
}
function exportThemeState() {
    const solved = {};
    const locked = {};
    const revealedMap = {};
    const hints = {};
    for (const [code, set] of Object.entries(solvedBy))
        solved[code] = Array.from(set);
    for (const [code, set] of Object.entries(lockedThisRound))
        locked[code] = Array.from(set);
    for (const [code, value] of Object.entries(revealed))
        revealedMap[code] = !!value;
    for (const [code, value] of Object.entries(hint))
        hints[code] = value !== null && value !== void 0 ? value : "";
    return {
        solvedBy: solved,
        lockedThisRound: locked,
        revealed: revealedMap,
        hint: hints,
    };
}
function importThemeState(snapshot) {
    var _a, _b, _c, _d;
    for (const key of Object.keys(solvedBy))
        delete solvedBy[key];
    for (const key of Object.keys(lockedThisRound))
        delete lockedThisRound[key];
    for (const key of Object.keys(revealed))
        delete revealed[key];
    for (const key of Object.keys(hint))
        delete hint[key];
    if (!snapshot)
        return;
    for (const [code, list] of Object.entries((_a = snapshot.solvedBy) !== null && _a !== void 0 ? _a : {})) {
        solvedBy[code] = new Set(list !== null && list !== void 0 ? list : []);
    }
    for (const [code, list] of Object.entries((_b = snapshot.lockedThisRound) !== null && _b !== void 0 ? _b : {})) {
        lockedThisRound[code] = new Set(list !== null && list !== void 0 ? list : []);
    }
    for (const [code, value] of Object.entries((_c = snapshot.revealed) !== null && _c !== void 0 ? _c : {})) {
        revealed[code] = !!value;
    }
    for (const [code, value] of Object.entries((_d = snapshot.hint) !== null && _d !== void 0 ? _d : {})) {
        hint[code] = value !== null && value !== void 0 ? value : "";
    }
}
// Utility
function obfuscateTheme(s) {
    return (s !== null && s !== void 0 ? s : "")
        .split(/\s+/)
        .map((w) => (w ? w[0] + "•".repeat(Math.max(0, w.length - 1)) : ""))
        .join(" ");
}
// Normalization for string compare
function normalize(s) {
    return (s !== null && s !== void 0 ? s : "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\p{L}\p{N} ]+/gu, "")
        .trim();
}
