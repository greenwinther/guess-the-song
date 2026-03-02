"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRoomCode = parseRoomCode;
exports.parseName = parseName;
exports.parseOptionalUrl = parseOptionalUrl;
exports.parseRequiredUrl = parseRequiredUrl;
exports.parseOptionalText = parseOptionalText;
exports.parseIntSafe = parseIntSafe;
exports.parseBool = parseBool;
exports.parseAvatarConfig = parseAvatarConfig;
const isString = (v) => typeof v === "string";
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
function normalizeRoomCode(input) {
    return String(input !== null && input !== void 0 ? input : "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}
function parseRoomCode(input) {
    const code = normalizeRoomCode(input);
    return code ? code : null;
}
function parseName(input, fallback) {
    const s = isString(input) ? input.trim() : "";
    return s || fallback;
}
function parseOptionalUrl(input) {
    if (input == null)
        return null;
    const s = isString(input) ? input.trim() : "";
    if (!s)
        return null;
    try {
        // eslint-disable-next-line no-new
        new URL(s);
        return s;
    }
    catch (_a) {
        return null;
    }
}
function parseRequiredUrl(input) {
    const v = parseOptionalUrl(input);
    return v !== null && v !== void 0 ? v : null;
}
function parseOptionalText(input) {
    if (!isString(input))
        return null;
    const s = input.trim();
    return s ? s : null;
}
function parseIntSafe(input) {
    if (isNumber(input))
        return Math.trunc(input);
    if (isString(input)) {
        const n = Number.parseInt(input, 10);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
function parseBool(input, fallback = false) {
    if (typeof input === "boolean")
        return input;
    return fallback;
}
function parseAvatarConfig(input) {
    if (!input || typeof input !== "object")
        return null;
    const obj = input;
    const base = isString(obj.base) ? obj.base : null;
    if (!base)
        return null;
    return {
        base,
        hair: isString(obj.hair) ? obj.hair : "empty",
        eyes: isString(obj.eyes) ? obj.eyes : "empty",
        mouth: isString(obj.mouth) ? obj.mouth : "empty",
        headwear: isString(obj.headwear) ? obj.headwear : "empty",
    };
}
