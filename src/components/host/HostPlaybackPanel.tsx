// src/components/host/HostPlaybackPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import Button from "@/components/ui/Button";
import type { Song } from "@/types/room";

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
}) {
	// ----- Results state (lives always; only used when scores != null) -----
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
	useEffect(() => {
		// whenever scores object changes (including going from null -> object), reset reveals
		setRevealedIdxs([]);
	}, [scores]);

	const reveal = (i: number) => setRevealedIdxs((prev) => (prev.includes(i) ? prev : [...prev, i]));

	const revealNext = () => {
		if (!grouped) return;
		const next = grouped.findIndex((_, i) => !revealedIdxs.includes(i));
		if (next !== -1) reveal(next);
	};

	const revealAll = () => {
		if (!grouped) return;
		setRevealedIdxs(grouped.map((_, i) => i));
	};

	const allRevealed = grouped ? revealedIdxs.length >= grouped.length : true;

	// ----- Results view -----
	if (scores && grouped) {
		return (
			<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
				<h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-4">Final Results</h2>

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
						{allRevealed ? "All revealed" : "Reveal next"}
					</Button>
					<Button variant="secondary" size="md" onClick={revealAll} disabled={allRevealed}>
						Reveal all
					</Button>
				</div>
			</main>
		);
	}

	// ----- In-progress playback -----
	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<h2 className="text-lg sm:text-2xl font-semibold text-text">
				{currentSong ? currentSong.title ?? "Unknown title" : "Press Play to start with track 1"}
			</h2>

			<div className="w-full mt-4 mb-4 sm:mt-6 sm:mb-6">
				<div className="rounded-lg overflow-hidden border border-border aspect-video">
					{currentSong ? (
						<ReactPlayer
							url={currentSong.url}
							controls
							playing={isPlaying && !!currentSong}
							width="100%"
							height="100%"
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

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3 w-full max-w-md mx-auto">
				<Button
					variant="secondary"
					size="md"
					onClick={onPrev}
					disabled={!currentSong}
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
					disabled={!currentSong}
					className="w-full sm:flex-1"
				>
					Next ▶
				</Button>
			</div>

			{!allPlayed ? (
				<p className="mt-3 sm:mt-4 text-xs sm:text-sm text-text-muted">
					Played {playedCount}/{totalSongs}
				</p>
			) : (
				<div className="flex gap-4 mt-3 sm:mt-4">
					<Button variant="secondary" size="md" onClick={onShowResults}>
						Show Results
					</Button>
				</div>
			)}
		</main>
	);
}
