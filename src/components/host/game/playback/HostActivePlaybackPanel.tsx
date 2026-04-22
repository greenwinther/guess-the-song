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
	fastRecap: boolean;
	isPlaying: boolean;
	playedCount: number;
	recapRunning: boolean;
	recapTriggered: boolean;
	totalSongs: number;
	onNext: () => void;
	onPlayPause: () => void;
	onPrev: () => void;
	onShowResults: () => void;
	onStartRecap?: () => void;
	onStopRecap?: () => void;
	onToggleFastRecap?: (checked: boolean) => void;
	onDuration: (duration: number) => void;
	onEnded: () => void;
	onProgress: (state: { playedSeconds: number }) => void;
	playerRef: RefObject<ReactPlayer>;
};

export default function HostActivePlaybackPanel({
	allPlayed,
	currentSong,
	fastRecap,
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
	onToggleFastRecap,
	onDuration,
	onEnded,
	onProgress,
	playerRef,
}: HostActivePlaybackPanelProps) {
	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
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

			{!allPlayed ? (
				<p className="mt-3 sm:mt-4 text-xs sm:text-sm text-text-muted">
					Played {playedCount}/{totalSongs}
				</p>
			) : (
				<HostRecapResultsActions
					fastRecap={fastRecap}
					recapRunning={recapRunning}
					recapTriggered={recapTriggered}
					onShowResults={onShowResults}
					onStartRecap={onStartRecap}
					onStopRecap={onStopRecap}
					onToggleFastRecap={onToggleFastRecap}
				/>
			)}
		</main>
	);
}
