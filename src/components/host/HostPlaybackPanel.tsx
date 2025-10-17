// src/components/host/HostPlaybackPanel.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import Button from "@/components/ui/Button";
import type { Song } from "@/types/room";
import { useGame } from "@/contexts/tempContext";
import { useThemeSockets } from "@/hooks/useThemeSockets";
import { useSocket } from "@/contexts/SocketContext";

export default function HostPlaybackPanel({
	code,
	currentSong,
	isPlaying,
	setIsPlaying,
	onPrev,
	onPlayPause,
	onNext,
	scores,
	playedCount,
	totalSongs,
	allPlayed,
	onShowResults,
	recapRunning = false,
	onStartRecap,
	onStopRecap,
	recapSeconds = 30,
	fastRecap = false,
	onToggleFastRecap,
}: {
	code: string;
	currentSong: Song | null;
	isPlaying: boolean;
	setIsPlaying: (v: boolean) => void;
	onPrev: () => void;
	onPlayPause: () => void;
	onNext: () => void;
	scores: Record<string, number> | null;
	playedCount: number;
	totalSongs: number;
	allPlayed: boolean;
	onShowResults: () => void;
	recapRunning?: boolean;
	onStartRecap?: () => void;
	onStopRecap?: () => void;
	recapSeconds?: number;
	fastRecap?: boolean;
	onToggleFastRecap?: (checked: boolean) => void;
}) {
	// ---------- HOOKS (always top-level, never conditional) ----------
	const socket = useSocket();
	const { room, theme, themeRevealed } = useGame();
	useThemeSockets();

	const grouped = useMemo(() => {
		if (!scores) return null;
		const ranking: [string, number][] = Object.entries(scores).sort(([, a], [, b]) => b - a);
		const acc: { score: number; names: string[] }[] = [];
		for (const [name, score] of ranking) {
			const g = acc.find((x) => x.score === score);
			if (g) g.names.push(name);
			else acc.push({ score, names: [name] });
		}
		return acc.slice(0, 3);
	}, [scores]);

	const [revealedIdxs, setRevealedIdxs] = useState<number[]>([]);
	const [recapTriggered, setRecapTriggered] = useState(false);
	const [durationSec, setDurationSec] = useState<number | null>(null);
	const [startAtSec, setStartAtSec] = useState(0);

	// recap / playback refs
	const playerRef = useRef<ReactPlayer | null>(null);
	const advancedRef = useRef(false);

	// reset reveals when scores appear/change
	useEffect(() => {
		setRevealedIdxs([]);
	}, [scores]);

	// When recap starts, ensure playback is on and reset guard
	useEffect(() => {
		if (recapRunning) {
			setIsPlaying(true);
			advancedRef.current = false;
		} else {
			advancedRef.current = false;
		}
	}, [recapRunning, setIsPlaying]);

	// When song changes, reset the guard so the new one can advance.
	useEffect(() => {
		advancedRef.current = false;
		setDurationSec(null);
		setStartAtSec(0);
	}, [currentSong?.id]);

	// also react if recap turns on or the clip length changes
	useEffect(() => {
		if (!recapRunning || durationSec == null) return;
		const s = computeStartAt(durationSec);
		setStartAtSec(s);
		playerRef.current?.seekTo(s, "seconds");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [recapRunning, recapSeconds, durationSec, currentSong?.id]);

	// ---------- SAFE EARLY RETURN (after hooks) ----------
	if (!room) {
		return <div className="p-4 text-text/70">Loading room…</div>;
	}

	// ---------- Handlers / helpers ----------
	const handleStartRecap = () => {
		setRecapTriggered(true);
		onStartRecap?.();
	};

	const reveal = (i: number) => setRevealedIdxs((prev) => (prev.includes(i) ? prev : [...prev, i]));

	const revealNextIndex = grouped
		? (() => {
				for (let i = grouped.length - 1; i >= 0; i--) {
					if (!revealedIdxs.includes(i)) return i;
				}
				return null;
		  })()
		: null;

	const revealNext = () => {
		if (revealNextIndex !== null) reveal(revealNextIndex);
	};

	const allRevealed = grouped ? revealedIdxs.length >= grouped.length : true;

	const revealLabel = () => {
		if (allRevealed) return "All revealed";
		if (revealNextIndex === 2) return "Reveal 3rd place";
		if (revealNextIndex === 1) return "Reveal 2nd place";
		if (revealNextIndex === 0) return "Reveal 1st place";
		return "Reveal next";
	};

	const computeStartAt = (d: number) => {
		const raw = d * 0.2;
		const maxStart = Math.max(0, d - recapSeconds);
		return Math.min(raw, maxStart);
	};

	// when we know the duration
	const handleDuration = (d: number) => {
		setDurationSec(d);
		if (recapRunning) {
			const s = computeStartAt(d);
			setStartAtSec(s);
			playerRef.current?.seekTo(s, "seconds");
		}
	};

	const handleProgress = (state: { playedSeconds: number }) => {
		if (!recapRunning || advancedRef.current) return;

		// stop after recapSeconds from the seek point
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

	// ---------- Results view ----------
	if (scores && grouped) {
		return (
			<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
				{/* Header row: Final Results + theme badge/button on the right */}
				<div className="w-full max-w-md flex items-center justify-between mb-3 sm:mb-4">
					<h2 className="text-xl sm:text-2xl font-semibold text-text">Final Results</h2>
					{/* If theme already revealed -> show name as a pill; else -> button to reveal */}
					{themeRevealed ? (
						<Button variant="secondary" size="sm" disabled className="whitespace-nowrap">
							{theme || "Theme"}
						</Button>
					) : (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => socket.emit("THEME_REVEAL", { code: room.code })}
							className="whitespace-nowrap"
						>
							Reveal Theme
						</Button>
					)}
				</div>

				<div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-md">
					{grouped.map((group, idx) => {
						const isRevealed = revealedIdxs.includes(idx);
						return (
							<button
								key={`${group.score}-${idx}`}
								onClick={() => reveal(idx)}
								disabled={isRevealed}
								className={`w-full text-left flex justify-between items-center py-2 border-b border-border last:border-b-0 transition ${
									isRevealed ? "cursor-default" : "hover:bg-card/40"
								}`}
								aria-expanded={isRevealed}
							>
								{isRevealed ? (
									<>
										<span className="text-text">
											#{idx + 1} {group.names.join(", ")}
										</span>
										<span className="text-text font-medium">{group.score} pts</span>
									</>
								) : (
									<span className="text-text italic">#{idx + 1} Click to reveal</span>
								)}
							</button>
						);
					})}
				</div>

				<div className="flex gap-3 mt-4">
					<Button variant="secondary" size="md" onClick={revealNext} disabled={allRevealed}>
						{revealLabel()}
					</Button>
				</div>
			</main>
		);
	}

	// ---------- In-progress playback ----------
	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<h2 className="text-lg sm:text-2xl font-semibold text-text">
				{currentSong ? currentSong.title ?? "Unknown title" : "Press Play to start with track 1"}
			</h2>

			<div className="w-full mt-4 mb-4 sm:mt-6 sm:mb-6">
				<div className="rounded-lg overflow-hidden border border-border aspect-video">
					{currentSong ? (
						<ReactPlayer
							ref={playerRef}
							url={currentSong.url}
							controls
							playing={isPlaying && !!currentSong}
							width="100%"
							height="100%"
							onProgress={handleProgress}
							onEnded={handleEnded}
							onDuration={handleDuration}
						/>
					) : (
						<div className="w-full h-full grid place-items-center bg-black/80 text-text-muted">
							<div className="text-center px-4">
								<p className="text-base sm:text-lg">No song selected</p>
								<p className="text-xs sm:text-sm opacity-80">
									Press <span className="font-medium">Play</span> to start with track 1
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Transport controls */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3 w-full max-w-md mx-auto">
				<Button
					variant="secondary"
					size="md"
					onClick={onPrev}
					disabled={!currentSong || recapRunning}
					className="w-full sm:flex-1"
				>
					◀ Previous
				</Button>

				<Button
					variant="primary"
					size="md"
					onClick={onPlayPause}
					aria-keyshortcuts="Space"
					aria-label="Play/Pause (Space)"
					className="w-full sm:flex-1"
				>
					{isPlaying ? "Pause" : currentSong ? "Play" : "Play • Start Track 1"}
				</Button>

				<Button
					variant="secondary"
					size="md"
					onClick={onNext}
					disabled={!currentSong || recapRunning}
					className="w-full sm:flex-1"
				>
					Next ▶
				</Button>
			</div>

			{/* Footer actions */}
			{!allPlayed ? (
				<p className="mt-3 sm:mt-4 text-xs sm:text-sm text-text-muted">
					Played {playedCount}/{totalSongs}
				</p>
			) : (
				<div className="w-full max-w-md mx-auto mt-3 sm:mt-4">
					{!recapRunning && (
						<label
							htmlFor="fast-recap"
							className="inline-flex items-center gap-2 select-none mb-2"
						>
							<input
								id="fast-recap"
								type="checkbox"
								className="h-4 w-4 accent-primary"
								checked={!!fastRecap}
								onChange={(e) => onToggleFastRecap?.(e.target.checked)}
							/>
							<span className="text-sm text-text">Fast recap</span>
						</label>
					)}

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
						{!recapRunning && onStartRecap ? (
							<Button
								variant={recapTriggered ? "secondary" : "primary"}
								size="md"
								onClick={handleStartRecap}
								className="w-full sm:flex-1"
							>
								Recap
							</Button>
						) : (
							<Button
								variant="danger"
								size="md"
								onClick={onStopRecap}
								className="w-full sm:flex-1"
							>
								Stop recap
							</Button>
						)}

						{/* IMPORTANT: Show Results now also reveals theme immediately */}
						<Button
							variant={recapTriggered ? "primary" : "secondary"}
							size="md"
							onClick={() => {
								onShowResults();
							}}
							className="w-full sm:flex-1"
						>
							Show Results
						</Button>
					</div>
				</div>
			)}
		</main>
	);
}
