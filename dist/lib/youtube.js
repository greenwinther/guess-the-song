"use strict";
// src/lib/youtube.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeID = getYouTubeID;
/** Extracts the "v=" ID from a YouTube URL, or null if none */
function getYouTubeID(url) {
    const trimmed = (url !== null && url !== void 0 ? url : "").trim();
    if (!trimmed)
        return null;
    // Standard watch URLs
    const match = trimmed.match(/[?&]v=([^&]+)/);
    if (match === null || match === void 0 ? void 0 : match[1])
        return match[1];
    // Short links: youtu.be/<id>
    const short = trimmed.match(/youtu\.be\/([^?&/]+)/);
    if (short === null || short === void 0 ? void 0 : short[1])
        return short[1];
    // Embed URLs: youtube.com/embed/<id>
    const embed = trimmed.match(/youtube\.com\/embed\/([^?&/]+)/);
    if (embed === null || embed === void 0 ? void 0 : embed[1])
        return embed[1];
    return null;
}
