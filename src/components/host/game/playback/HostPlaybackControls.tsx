"use client";

import { FaBackwardStep, FaForwardStep, FaPause, FaPlay } from "react-icons/fa6";
import Button from "@/components/shared/Button";

import type { Submission } from "@/types/submission";

type HostPlaybackControlsProps = {
	currentSong: Submission | null;
	isPlaying: boolean;
	autoPlaybackRunning: boolean;
	nextPending?: boolean;
	onNext: () => void;
	onPlayPause: () => void;
	onPrev: () => void;
};

export default function HostPlaybackControls({
	currentSong,
	isPlaying,
	autoPlaybackRunning,
	nextPending = false,
	onNext,
	onPlayPause,
	onPrev,
}: HostPlaybackControlsProps) {
	if (autoPlaybackRunning) {
		return (
			<div className="grid w-full max-w-md grid-cols-1 gap-2 sm:mx-auto sm:gap-3">
				<Button
					variant="primary"
					size="md"
					onClick={onPlayPause}
					aria-keyshortcuts="Space"
					aria-label="Play/Pause (Space)"
					className="w-full py-4 text-lg"
				>
					{isPlaying ? (
						<FaPause className="h-5 w-5" aria-hidden="true" />
					) : (
						<FaPlay className="h-5 w-5" aria-hidden="true" />
					)}
					{isPlaying ? "Pause" : "Play"}
				</Button>
			</div>
		);
	}

	return (
		<div className="grid w-full max-w-md grid-cols-2 gap-2 sm:mx-auto sm:grid-cols-[1fr_1.2fr_1fr] sm:items-center sm:gap-3">
			<Button
				variant="secondary"
				size="md"
				onClick={onPrev}
				disabled={!currentSong}
				className="w-full py-3"
			>
				<FaBackwardStep className="h-4 w-4" aria-hidden="true" />
				Previous
			</Button>

			<Button
				variant="primary"
				size="md"
				onClick={onPlayPause}
				aria-keyshortcuts="Space"
				aria-label="Play/Pause (Space)"
				className="order-first col-span-2 w-full py-4 text-lg sm:order-none sm:col-span-1 sm:min-w-[11.5rem] sm:justify-self-center"
			>
				{isPlaying ? (
					<FaPause className="h-5 w-5" aria-hidden="true" />
				) : (
					<FaPlay className="h-5 w-5" aria-hidden="true" />
				)}
				{isPlaying ? "Pause" : "Play"}
			</Button>

			<Button
				variant="secondary"
				size="md"
				onClick={onNext}
				disabled={!currentSong || nextPending}
				className="w-full py-3"
			>
				Next
				<FaForwardStep className="h-4 w-4" aria-hidden="true" />
			</Button>
		</div>
	);
}
