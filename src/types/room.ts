import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";

export type Room = {
	id: number;
	code: string;
	phase?: "LOBBY" | "GUESSING" | "RECAP" | "RESULTS";
	theme?: string;
	detailQuestion?: string;
	backgroundUrl?: string | null;
	hardcoreRequired?: boolean;
	players: Member[];
	songs: Submission[];
};
