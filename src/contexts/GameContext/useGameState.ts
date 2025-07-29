// contexts/gameContext/useGameState.ts
import { useState, useCallback } from "react";
import { GameContextType, Clip } from "./types";
import { Player, Room, Song } from "@/types/room";

export const useGameState = (): GameContextType => {
	const [room, setRoom] = useState<Room | null>(null);
	const [gameStarted, setGameStarted] = useState(false);
	const [currentClip, setCurrentClip] = useState<Clip | null>(null);
	const [currentSong, setCurrentSong] = useState<Song | null>(null);
	const [bgThumbnail, setBgThumbnail] = useState<string | null>(null);
	const [guesses, setGuesses] = useState<Record<number, string[]>>({});
	const [scores, setScores] = useState<Record<string, number> | null>(null);
	const [revealedSongs, setRevealedSongs] = useState<number[]>([]);
	const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([]);
	const [theme, setTheme] = useState<string>("");
	const [backgroundUrl, setBackgroundUrl] = useState<string>("");

	const addPlayer = useCallback((player: Player) => {
		setRoom((prev) => {
			if (!prev) return prev;
			if (prev.players.find((p) => p.id === player.id)) return prev;
			return { ...prev, players: [...prev.players, player] };
		});
	}, []);

	const addSong = useCallback((song: Song) => {
		setRoom((prev) => {
			if (!prev) return prev;
			return { ...prev, songs: [...prev.songs, song] };
		});
	}, []);

	const removeSong = useCallback((songId: number) => {
		setRoom((prev) => {
			if (!prev) return prev;
			return { ...prev, songs: prev.songs.filter((s) => s.id !== songId) };
		});
	}, []);

	return {
		room,
		setRoom,
		gameStarted,
		setGameStarted,
		currentClip,
		setCurrentClip,
		currentSong,
		setCurrentSong,
		bgThumbnail,
		setBgThumbnail,
		guesses,
		setGuesses,
		scores,
		setScores,
		revealedSongs,
		setRevealedSongs,
		submittedPlayers,
		setSubmittedPlayers,
		addPlayer,
		addSong,
		removeSong,
		theme,
		setTheme,
		backgroundUrl,
		setBackgroundUrl,
	};
};
