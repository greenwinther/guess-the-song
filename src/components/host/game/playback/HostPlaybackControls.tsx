"use client";

import { FaBackwardStep, FaForwardStep, FaPause, FaPlay } from "react-icons/fa6";
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
		<div className="grid w-full max-w-md grid-cols-2 gap-2 sm:mx-auto sm:grid-cols-[0.8fr_1.4fr_0.8fr] sm:items-center sm:gap-3">
			<Button
				variant="secondary"
				size="sm"
				onClick={onPrev}
				disabled={!currentSong || recapRunning}
				className="w-full"
			>
				<FaBackwardStep className="h-3 w-3" aria-hidden="true" />
				Previous
			</Button>

			<Button
				variant="primary"
				size="md"
				onClick={onPlayPause}
				aria-keyshortcuts="Space"
				aria-label="Play/Pause (Space)"
				className="order-first col-span-2 w-full sm:order-none sm:col-span-1"
			>
				{isPlaying ? (
					<FaPause className="h-3.5 w-3.5" aria-hidden="true" />
				) : (
					<FaPlay className="h-3.5 w-3.5" aria-hidden="true" />
				)}
				{isPlaying ? "Pause" : "Play"}
			</Button>

			<Button
				variant="secondary"
				size="sm"
				onClick={onNext}
				disabled={!currentSong || recapRunning}
				className="w-full"
			>
				Next
				<FaForwardStep className="h-3 w-3" aria-hidden="true" />
			</Button>
		</div>
	);
}
