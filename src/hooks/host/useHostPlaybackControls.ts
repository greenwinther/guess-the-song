"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { Submission } from "@/types/submission";

type UseHostPlaybackControlsOptions = {
	code: string;
	currentClip?: { songId: number; clipUrl: string } | null;
	currentSong: Submission | null;
	recapRunning: boolean;
	revealedSongs: number[];
	setRevealedSongs: (songIds: number[]) => void;
	songs: Submission[];
	totalSongs: number;
	onStopRecap: () => void;
	onToggleDebug: () => void;
};

export function useHostPlaybackControls({
	code,
	currentClip,
	currentSong,
	recapRunning,
	revealedSongs,
	setRevealedSongs,
	songs,
	totalSongs,
	onStopRecap,
	onToggleDebug,
}: UseHostPlaybackControlsOptions) {
	const socket = useSocket();
	const [isPlaying, setIsPlaying] = useState(false);

	const currentIndex = useMemo(
		() => (currentSong ? songs.findIndex((song) => song.id === currentSong.id) : -1),
		[songs, currentSong],
	);

	const playSong = useCallback(
		(song: Submission) => {
			socket.emit("playSong", { code, songId: song.id }, () => {
				if (!revealedSongs.includes(song.id)) {
					const updated = [...revealedSongs, song.id];
					setRevealedSongs(updated);
					socket.emit("revealedSongs", { code, revealed: updated });
				}
			});
			setIsPlaying(true);
		},
		[socket, code, revealedSongs, setRevealedSongs],
	);

	const playAtIndex = useCallback(
		(index: number) => {
			if (!songs[index]) return;
			playSong(songs[index]);
		},
		[songs, playSong],
	);

	const playPrevious = useCallback(() => {
		if (currentIndex > 0) playAtIndex(currentIndex - 1);
	}, [currentIndex, playAtIndex]);

	const playNext = useCallback(() => {
		socket.emit("nextSong", { code }, () => {});

		const lastIndex = totalSongs - 1;
		if (currentIndex >= 0 && currentIndex < lastIndex) {
			playAtIndex(currentIndex + 1);
			return;
		}

		if (recapRunning) onStopRecap();
		setIsPlaying(false);
	}, [socket, code, totalSongs, currentIndex, playAtIndex, recapRunning, onStopRecap]);

	const playOrPause = useCallback(() => {
		if (!currentSong) {
			playAtIndex(0);
			return;
		}
		if (!currentClip || currentClip.songId !== currentSong.id) {
			playSong(currentSong);
			return;
		}
		setIsPlaying((prev) => !prev);
	}, [currentSong, currentClip, playAtIndex, playSong]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) return;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				return;
			}

			if (event.code === "Space") {
				event.preventDefault();
				playOrPause();
			}
			if (event.code === "ArrowLeft" && currentIndex > 0) playAtIndex(currentIndex - 1);
			if (event.code === "ArrowRight" && currentIndex >= 0 && currentIndex < songs.length - 1) {
				playAtIndex(currentIndex + 1);
			}
			if (event.code === "KeyD") {
				onToggleDebug();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, songs.length, playAtIndex, playOrPause, onToggleDebug]);

	return {
		currentIndex,
		isPlaying,
		playNext,
		playOrPause,
		playPrevious,
		playSong,
		setIsPlaying,
	};
}
