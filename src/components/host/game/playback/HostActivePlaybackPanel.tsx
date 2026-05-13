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
	recapCompleted: boolean;
	revealRunning: boolean;
	revealSubmitterName?: string | null;
	revealDetailAnswer?: string | null;
	showRevealDetails?: boolean;
	totalSongs: number;
	onNext: () => void;
	onPlayPause: () => void;
	onPrev: () => void;
	nextPending?: boolean;
	onRevealResults: () => void;
	onStartRecap?: () => void;
	onSkipRecap?: () => void;
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
	recapCompleted,
	revealRunning,
	revealSubmitterName,
	revealDetailAnswer,
	showRevealDetails = false,
	totalSongs,
	onNext,
	onPlayPause,
	onPrev,
	nextPending = false,
	onRevealResults,
	onStartRecap,
	onSkipRecap,
	onDuration,
	onEnded,
	onProgress,
	playerRef,
}: HostActivePlaybackPanelProps) {
	const autoPlaybackRunning = recapRunning || revealRunning;

	return (
		<section className="flex min-h-0 flex-1 flex-col gap-4">
			<div className="flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex h-14 w-full items-start justify-center pt-1 text-center sm:h-16">
					<h2 className="line-clamp-2 max-w-3xl text-lg font-semibold leading-tight text-text sm:text-2xl">
						{currentSong
							? currentSong.title ?? "Unknown title"
							: "Press Play to start with track 1"}
					</h2>
				</div>

				<div className="flex h-[5.5rem] w-full items-center justify-center rounded-lg bg-black/15 p-3 text-center shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:p-4">
					<div
						className={`space-y-1 transition-all duration-500 ${
							revealRunning && showRevealDetails
								? "translate-y-0 opacity-100"
								: "translate-y-2 opacity-0"
						}`}
					>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
							Submitted by
						</p>
						<p className="text-2xl font-extrabold text-highlight sm:text-3xl">
							{revealSubmitterName ?? "-"}
						</p>
						{revealDetailAnswer && (
							<p className="text-sm font-medium text-secondary sm:text-base">
								Bonus answer: {revealDetailAnswer}
							</p>
						)}
					</div>
				</div>

				<div className="flex w-full flex-col gap-4">
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
						autoPlaybackRunning={autoPlaybackRunning}
						onNext={onNext}
						onPlayPause={onPlayPause}
						onPrev={onPrev}
						nextPending={nextPending}
					/>
				</div>
			</div>

			<div className="w-full">
				{!allPlayed ? (
					<p className="text-center text-xs text-text-muted sm:text-sm">
						Played {playedCount}/{totalSongs}
					</p>
				) : (
					<HostRecapResultsActions
						recapRunning={recapRunning}
						recapCompleted={recapCompleted}
						revealRunning={revealRunning}
						onRevealResults={onRevealResults}
						onStartRecap={onStartRecap}
						onSkipRecap={onSkipRecap}
					/>
				)}
			</div>
		</section>
	);
}
