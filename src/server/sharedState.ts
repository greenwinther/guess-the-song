// src/server/socket/sharedState.ts

// Tracks which rooms have started (optional – you already had this)
export const gamesInProgress: Record<string, boolean> = {};

// Song reveal state you already use
export const revealedSongsByRoom: Record<string, number[]> = {};

// Final scores cache you already use
export const finalScoresByRoom: Record<string, Record<string, number>> = {};

// The current active song for each room (null when none)
export const activeSongByRoom: Record<string, number | null> = {};
