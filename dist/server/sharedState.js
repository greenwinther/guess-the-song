"use strict";
// src/server/socket/sharedState.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeSongByRoom = exports.finalScoresByRoom = exports.revealedSongsByRoom = exports.gamesInProgress = void 0;
// Tracks which rooms have started (optional – you already had this)
exports.gamesInProgress = {};
// Song reveal state you already use
exports.revealedSongsByRoom = {};
// Final scores cache you already use
exports.finalScoresByRoom = {};
// The current active song for each room (null when none)
exports.activeSongByRoom = {};
