import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";

export type HardcoreRewardMode = "none" | "startBonus" | "multiplier";
export type RoomTieBreaker = "none" | "fastestCorrectLocks";

export type HardcoreRules = {
	enabled: boolean;
	rewardMode: HardcoreRewardMode;
	startBonusPoints: number;
	multiplier: number;
};

export type ThemeRules = {
	guessesPerSong: number;
	correctThemePoints: number;
	firstCorrectThemeBonusEnabled: boolean;
	firstCorrectThemePoints: number;
};

export type RoomScoring = {
	guessPoints: number;
	detailGuessPoints: number;
	// Legacy flat fields kept for older clients/imports. New code should prefer themeRules/hardcoreRules.
	themeGuessPoints: number;
	hardcoreMultiplier: number;
	hardcoreRules: HardcoreRules;
	themeRules: ThemeRules;
	tieBreaker: RoomTieBreaker;
};

export const DEFAULT_ROOM_SCORING: RoomScoring = {
	guessPoints: 1,
	detailGuessPoints: 1,
	themeGuessPoints: 1,
	hardcoreMultiplier: 1.5,
	hardcoreRules: {
		enabled: true,
		rewardMode: "multiplier",
		startBonusPoints: 1,
		multiplier: 1.5,
	},
	themeRules: {
		guessesPerSong: 1,
		correctThemePoints: 1,
		firstCorrectThemeBonusEnabled: false,
		firstCorrectThemePoints: 2,
	},
	tieBreaker: "none",
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
