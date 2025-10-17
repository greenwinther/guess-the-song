"use strict";
// Minimal in-memory helpers; keyed by room code (same as lib/game.ts style)
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
exports.obfuscateTheme = obfuscateTheme;
exports.normalize = normalize;
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
}
function lockPlayerThisRound(code, playerName) {
    initThemeState(code);
    lockedThisRound[code].add(playerName);
}
function hasLockedThisRound(code, playerName) {
    initThemeState(code);
    return lockedThisRound[code].has(playerName);
}
function clearRoundLocks(code) {
    initThemeState(code);
    lockedThisRound[code] = new Set();
}
function markSolved(code, playerName) {
    initThemeState(code);
    solvedBy[code].add(playerName);
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
}
function isRevealed(code) {
    initThemeState(code);
    return revealed[code];
}
function setHint(code, value) {
    initThemeState(code);
    hint[code] = value;
}
function getHint(code) {
    initThemeState(code);
    return hint[code];
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
