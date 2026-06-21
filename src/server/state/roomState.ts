import type { Room, RoomScoring } from "@/types/room";

// Server-only room shape. Add internal-only fields here as needed.
export type RoomState = Room & {
	createdAt: number;
	updatedAt: number;
	adminAccessToken: string;
	hostAccessToken: string;
	adminOwnerClientId?: string | null;
	hostOwnerClientId?: string | null;
	rules: RoomScoring & {
		hardcoreRequired: boolean;
	};
	kicked?: Record<string, number>; // normalized name -> unix ms until allowed
};
