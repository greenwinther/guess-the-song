//src/types/game.ts
export interface Player {
	id: string;
	name: string;
	isHost: boolean;
	socketId: string;
}

export interface Song {
	id: string;
	url: string;
	submitter: string;
}

export interface Room {
	roomId: string;
	hostId: string;
	songs: Song[];
	players: Player[];
	currentPhase: GamePhase;
	currentSongIndex: number;
	guesses: { [playerId: string]: PlayerGuess[] };
	scores: { [playerId: string]: number };
}

export interface PlayerGuess {
	songIndex: number;
	guessedSubmitterId: string;
}

export type SongEntry = {
	title: string;
	submitterId: string;
};

export type GamePhase = "lobby" | "guessing" | "reveal" | "scoreboard";
