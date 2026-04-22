"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type ReactPlayer from "react-player";

type UseHostRecapPlaybackOptions = {
	currentSongId?: number;
	recapRunning: boolean;
	recapSeconds: number;
	setIsPlaying: (value: boolean) => void;
	onNext: () => void;
};

export function useHostRecapPlayback({
	currentSongId,
	recapRunning,
	recapSeconds,
	setIsPlaying,
	onNext,
}: UseHostRecapPlaybackOptions) {
	const playerRef = useRef<ReactPlayer | null>(null);
	const advancedRef = useRef(false);
	const [durationSec, setDurationSec] = useState<number | null>(null);
	const [startAtSec, setStartAtSec] = useState(0);

	useEffect(() => {
		if (recapRunning) {
			setIsPlaying(true);
		}
		advancedRef.current = false;
	}, [recapRunning, setIsPlaying]);

	useEffect(() => {
		advancedRef.current = false;
		setDurationSec(null);
		setStartAtSec(0);
	}, [currentSongId]);

	const computeStartAt = useCallback((duration: number) => {
		const raw = duration * 0.2;
		const maxStart = Math.max(0, duration - recapSeconds);
		return Math.min(raw, maxStart);
	}, [recapSeconds]);

	useEffect(() => {
		if (!recapRunning || durationSec == null) return;
		const startAt = computeStartAt(durationSec);
		setStartAtSec(startAt);
		playerRef.current?.seekTo(startAt, "seconds");
	}, [recapRunning, durationSec, currentSongId, computeStartAt]);

	const handleDuration = (duration: number) => {
		setDurationSec(duration);
		if (recapRunning) {
			const startAt = computeStartAt(duration);
			setStartAtSec(startAt);
			playerRef.current?.seekTo(startAt, "seconds");
		}
	};

	const handleProgress = (state: { playedSeconds: number }) => {
		if (!recapRunning || advancedRef.current) return;

		if (state.playedSeconds >= startAtSec + recapSeconds - 0.15) {
			advancedRef.current = true;
			onNext();
		}
	};

	const handleEnded = () => {
		if (recapRunning && !advancedRef.current) {
			advancedRef.current = true;
			onNext();
		}
	};

	return { handleDuration, handleEnded, handleProgress, playerRef };
}
