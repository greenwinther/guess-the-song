import type { Room } from "@/types/room";

// Server-only room shape. Add internal-only fields here as needed.
export type RoomState = Room & {
	createdAt: number;
	updatedAt: number;
	rules: {
		hardcoreMultiplier: number;
		hardcoreRequired: boolean;
	};
	kicked?: Record<string, number>; // normalized name -> unix ms until allowed
};
