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
		<>
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
							onProgress={onProgress}
							onEnded={onEnded}
							onDuration={onDuration}
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
		</>
	);
}
