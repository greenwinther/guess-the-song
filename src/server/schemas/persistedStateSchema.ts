import { z } from "zod";

const persistedRoomSchema = z.looseObject({
	code: z.string().min(1),
	updatedAt: z.number().optional(),
	createdAt: z.number().optional(),
});

const persistedRoomStoreSchema = z.looseObject({
	rooms: z.array(persistedRoomSchema).default([]),
	nextRoomId: z.number().int().positive().optional(),
	nextPlayerId: z.number().int().positive().optional(),
	nextSongId: z.number().int().positive().optional(),
});

export const persistedStateSchema = z.object({
	version: z.literal(1),
	savedAt: z.number(),
	roomStore: persistedRoomStoreSchema,
	gameState: z.record(z.string(), z.unknown()).default({}),
	rounds: z.record(z.string(), z.unknown()).default({}),
	theme: z
		.object({
			solvedBy: z.record(z.string(), z.unknown()).default({}),
			lockedThisRound: z.record(z.string(), z.unknown()).default({}),
			guessesThisRound: z.record(z.string(), z.unknown()).default({}),
			revealed: z.record(z.string(), z.unknown()).default({}),
			hint: z.record(z.string(), z.unknown()).default({}),
		})
		.default({
			solvedBy: {},
			lockedThisRound: {},
			guessesThisRound: {},
			revealed: {},
			hint: {},
		}),
});
