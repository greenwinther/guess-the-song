"use client";

import type { RefObject } from "react";
import type ReactPlayer from "react-player";

import HostPlaybackControls from "@/components/host/game/playback/HostPlaybackControls";
import HostRecapResultsActions from "@/components/host/game/playback/HostRecapResultsActions";
import HostSongPlaybackDisplay from "@/components/host/game/playback/HostSongPlaybackDisplay";

import type { Submission } from "@/types/submission";

type HostActivePlaybackPanelProps = {
	allPlayed: boolean;
	currentSong: Submission | null;
	isPlaying: boolean;
	playedCount: number;
	recapRunning: boolean;
	recapTriggered: boolean;
	totalSongs: number;
	onNext: () => void;
	onPlayPause: () => void;
	onPrev: () => void;
	onShowResults: () => void;
	onStartRecap?: (fast: boolean) => void;
	onStopRecap?: () => void;
	onDuration: (duration: number) => void;
	onEnded: () => void;
	onProgress: (state: { playedSeconds: number }) => void;
	playerRef: RefObject<ReactPlayer>;
};

export default function HostActivePlaybackPanel({
	allPlayed,
	currentSong,
	isPlaying,
	playedCount,
	recapRunning,
	recapTriggered,
	totalSongs,
	onNext,
	onPlayPause,
	onPrev,
	onShowResults,
	onStartRecap,
	onStopRecap,
	onDuration,
	onEnded,
	onProgress,
	playerRef,
}: HostActivePlaybackPanelProps) {
	return (
		<section className="flex flex-col items-center gap-6">
			<h2 className="text-lg sm:text-2xl font-semibold text-text">
				{currentSong ? currentSong.title ?? "Unknown title" : "Press Play to start with track 1"}
			</h2>

			<div className="flex w-full flex-col gap-6">
				<HostSongPlaybackDisplay
					currentSong={currentSong}
					isPlaying={isPlaying}
					onDuration={onDuration}
					onEnded={onEnded}
					onProgress={onProgress}
					playerRef={playerRef}
				/>

				<HostPlaybackControls
					currentSong={currentSong}
					isPlaying={isPlaying}
					recapRunning={recapRunning}
					onNext={onNext}
					onPlayPause={onPlayPause}
					onPrev={onPrev}
				/>
			</div>

			<div className="w-full pt-4">
				{!allPlayed ? (
					<p className="text-center text-xs text-text-muted sm:text-sm">
						Played {playedCount}/{totalSongs}
					</p>
				) : (
					<HostRecapResultsActions
						recapRunning={recapRunning}
						recapTriggered={recapTriggered}
						onShowResults={onShowResults}
						onStartRecap={onStartRecap}
						onStopRecap={onStopRecap}
					/>
				)}
			</div>
		</section>
	);
}
