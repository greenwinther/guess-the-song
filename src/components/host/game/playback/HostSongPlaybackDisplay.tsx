"use client";

import type { RefObject } from "react";
import ReactPlayer from "react-player";

import type { Submission } from "@/types/submission";

type HostSongPlaybackDisplayProps = {
	currentSong: Submission | null;
	isPlaying: boolean;
	onDuration: (duration: number) => void;
	onEnded: () => void;
	onProgress: (state: { playedSeconds: number }) => void;
	playerRef: RefObject<ReactPlayer>;
};

export default function HostSongPlaybackDisplay({
	currentSong,
	isPlaying,
	onDuration,
	onEnded,
	onProgress,
	playerRef,
}: HostSongPlaybackDisplayProps) {
	return (
		<div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
			{currentSong ? (
				<ReactPlayer
					ref={playerRef}
					url={currentSong.url}
					controls
					playing={isPlaying && !!currentSong}
					width="100%"
					height="100%"
					onProgress={onProgress}
					onEnded={onEnded}
					onDuration={onDuration}
				/>
			) : (
				<div className="grid h-full w-full place-items-center bg-black/80 text-text-muted">
					<div className="px-4 text-center">
						<p className="text-base sm:text-lg">No song selected</p>
						<p className="text-xs opacity-80 sm:text-sm">
							Press <span className="font-medium">Play</span> to start with track 1
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
