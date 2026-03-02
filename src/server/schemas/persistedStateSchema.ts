import { z } from "zod";

const persistedRoomSchema = z
	.object({
		code: z.string().min(1),
		updatedAt: z.number().finite().optional(),
		createdAt: z.number().finite().optional(),
	})
	.passthrough();

const persistedRoomStoreSchema = z
	.object({
		rooms: z.array(persistedRoomSchema).default([]),
		nextRoomId: z.number().int().positive().optional(),
		nextPlayerId: z.number().int().positive().optional(),
		nextSongId: z.number().int().positive().optional(),
	})
	.passthrough();

export const persistedStateSchema = z.object({
	version: z.literal(1),
	savedAt: z.number().finite(),
	roomStore: persistedRoomStoreSchema,
	gameState: z.record(z.string(), z.unknown()).default({}),
	rounds: z.record(z.string(), z.unknown()).default({}),
	theme: z
		.object({
			solvedBy: z.record(z.string(), z.unknown()).default({}),
			lockedThisRound: z.record(z.string(), z.unknown()).default({}),
			revealed: z.record(z.string(), z.unknown()).default({}),
			hint: z.record(z.string(), z.unknown()).default({}),
		})
		.default({
			solvedBy: {},
			lockedThisRound: {},
			revealed: {},
			hint: {},
		}),
});

export type PersistedStateSnapshot = z.infer<typeof persistedStateSchema>;
