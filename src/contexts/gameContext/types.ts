// src/contexts/gameContext/types.ts
import { Room, type RoomTieBreaker } from "@/types/room";
import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";

export type Clip = {
	songId: number;
	clipUrl: string;
};

export type RoomStateContextType = {
	room: Room | null;
	setRoom: React.Dispatch<React.SetStateAction<Room | null>>;

	addPlayer: (player: Member) => void;
	addSong: (song: Submission) => void;
	removeSong: (songId: number) => void;
};

export type RuntimeStateContextType = {
	currentClip: Clip | null;
	setCurrentClip: (clip: Clip | null) => void;

	currentSong: Submission | null;
	setCurrentSong: React.Dispatch<React.SetStateAction<Submission | null>>;

	bgThumbnail: string | null;
	setBgThumbnail: React.Dispatch<React.SetStateAction<string | null>>;

	useSongArtworkBackground: boolean;
	setUseSongArtworkBackground: React.Dispatch<React.SetStateAction<boolean>>;

	scores: Record<string, number> | null;
	setScores: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;

	finalTieBreaker: RoomTieBreaker;
	setFinalTieBreaker: React.Dispatch<React.SetStateAction<RoomTieBreaker>>;

	finalTieBreakerStats: Record<string, { fastestCorrectLocks: number }>;
	setFinalTieBreakerStats: React.Dispatch<
		React.SetStateAction<Record<string, { fastestCorrectLocks: number }>>
	>;

	revealedSongs: number[];
	setRevealedSongs: React.Dispatch<React.SetStateAction<number[]>>;

	submittedPlayers: string[];
	setSubmittedPlayers: React.Dispatch<React.SetStateAction<string[]>>;

	theme: string;
	setTheme: (theme: string) => void;

	revealedSubmitters: number[];
	setRevealedSubmitters: React.Dispatch<React.SetStateAction<number[]>>;

	revealedDetailAnswers: number[];
	setRevealedDetailAnswers: React.Dispatch<React.SetStateAction<number[]>>;

	solvedByTheme: string[];
	setSolvedByTheme: React.Dispatch<React.SetStateAction<string[]>>;

	lockedForThisRound: string[];
	setLockedForThisRound: React.Dispatch<React.SetStateAction<string[]>>;

	themeHint: string | null; // obfuscated, e.g., "D•••••"
	setThemeHint: React.Dispatch<React.SetStateAction<string | null>>;

	themeRevealed: boolean;
	setThemeRevealed: React.Dispatch<React.SetStateAction<boolean>>;
};
