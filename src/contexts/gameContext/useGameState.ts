// src/contexts/gameContext/useGameState.ts
import { useState, useCallback } from "react";
import { Clip, RoomStateContextType, RuntimeStateContextType } from "./types";
import { Room } from "@/types/room";
import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";

export const useRoomStateValue = (): RoomStateContextType => {
	const [room, setRoom] = useState<Room | null>(null);

	const addPlayer = useCallback((player: Member) => {
		setRoom((prev) => {
			if (!prev) return prev;
			if (prev.players.find((p) => p.id === player.id)) return prev;
			return { ...prev, players: [...prev.players, player] };
		});
	}, []);

	const addSong = useCallback((song: Submission) => {
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
		addPlayer,
		addSong,
		removeSong,
	};
};

export const useRuntimeStateValue = (): RuntimeStateContextType => {
	const [currentClip, setCurrentClip] = useState<Clip | null>(null);
	const [currentSong, setCurrentSong] = useState<Submission | null>(null);
	const [bgThumbnail, setBgThumbnail] = useState<string | null>(null);
	const [scores, setScores] = useState<Record<string, number> | null>(null);
	const [revealedSongs, setRevealedSongs] = useState<number[]>([]);
	const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([]);
	const [revealedSubmitters, setRevealedSubmitters] = useState<number[]>([]);
	const [revealedDetailAnswers, setRevealedDetailAnswers] = useState<number[]>([]);
	const [theme, setTheme] = useState<string>("");
	const [solvedByTheme, setSolvedByTheme] = useState<string[]>([]);
	const [lockedForThisRound, setLockedForThisRound] = useState<string[]>([]);
	const [themeHint, setThemeHint] = useState<string | null>(null);
	const [themeRevealed, setThemeRevealed] = useState(false);

	return {
		currentClip,
		setCurrentClip,
		currentSong,
		setCurrentSong,
		bgThumbnail,
		setBgThumbnail,
		scores,
		setScores,
		revealedSongs,
		setRevealedSongs,
		submittedPlayers,
		setSubmittedPlayers,
		theme,
		setTheme,
		revealedSubmitters,
		setRevealedSubmitters,
		revealedDetailAnswers,
		setRevealedDetailAnswers,
		solvedByTheme,
		setSolvedByTheme,
		lockedForThisRound,
		setLockedForThisRound,
		themeHint,
		setThemeHint,
		themeRevealed,
		setThemeRevealed,
	};
};
