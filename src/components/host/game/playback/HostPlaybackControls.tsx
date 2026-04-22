"use client";

import Button from "@/components/shared/Button";

import type { Submission } from "@/types/submission";

type HostPlaybackControlsProps = {
	currentSong: Submission | null;
	isPlaying: boolean;
	recapRunning: boolean;
	onNext: () => void;
	onPlayPause: () => void;
	onPrev: () => void;
};

export default function HostPlaybackControls({
	currentSong,
	isPlaying,
	recapRunning,
	onNext,
	onPlayPause,
	onPrev,
}: HostPlaybackControlsProps) {
	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3 w-full max-w-md mx-auto">
			<Button
				variant="secondary"
				size="md"
				onClick={onPrev}
				disabled={!currentSong || recapRunning}
				className="w-full sm:flex-1"
			>
				Previous
			</Button>

			<Button
				variant="primary"
				size="md"
				onClick={onPlayPause}
				aria-keyshortcuts="Space"
				aria-label="Play/Pause (Space)"
				className="w-full sm:flex-1"
			>
				{isPlaying ? "Pause" : "Play"}
			</Button>

			<Button
				variant="secondary"
				size="md"
				onClick={onNext}
				disabled={!currentSong || recapRunning}
				className="w-full sm:flex-1"
			>
				Next
			</Button>
		</div>
	);
}
