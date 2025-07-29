// contexts/gameContext/types.ts
import { Room, Player, Song } from "@/types/room";

export type Clip = {
	songId: number;
	clipUrl: string;
};

export type GameContextType = {
	room: Room | null;
	setRoom: React.Dispatch<React.SetStateAction<Room | null>>;

	gameStarted: boolean;
	setGameStarted: (b: boolean) => void;

	currentClip: Clip | null;
	setCurrentClip: (clip: Clip | null) => void;

	currentSong: Song | null;
	setCurrentSong: React.Dispatch<React.SetStateAction<Song | null>>;

	bgThumbnail: string | null;
	setBgThumbnail: React.Dispatch<React.SetStateAction<string | null>>;

	guesses: Record<number, string[]>;
	setGuesses: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;

	scores: Record<string, number> | null;
	setScores: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;

	revealedSongs: number[];
	setRevealedSongs: React.Dispatch<React.SetStateAction<number[]>>;

	submittedPlayers: string[];
	setSubmittedPlayers: React.Dispatch<React.SetStateAction<string[]>>;

	addPlayer: (player: Player) => void;
	addSong: (song: Song) => void;
	removeSong: (songId: number) => void;

	theme: string;
	setTheme: (theme: string) => void;

	backgroundUrl: string;
	setBackgroundUrl: (url: string) => void;
};
