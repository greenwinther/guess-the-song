// src/server/socket/sharedState.ts
export const gamesInProgress: Record<string, boolean> = {};
export const finalScoresByRoom: Record<string, Record<string, number>> = {};
export const revealedSongsByRoom: Record<string, number[]> = {};
