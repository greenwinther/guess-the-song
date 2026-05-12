import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";

export type RoomScoring = {
	guessPoints: number;
	detailGuessPoints: number;
	themeGuessPoints: number;
	hardcoreMultiplier: number;
};

export type Room = {
	id: number;
	code: string;
	phase?: "LOBBY" | "GUESSING" | "RECAP" | "REVEAL" | "RESULTS" | "ENDED";
	theme?: string;
	detailQuestion?: string;
	backgroundUrl?: string | null;
	hardcoreRequired?: boolean;
	scoring: RoomScoring;
	players: Member[];
	songs: Submission[];
};
