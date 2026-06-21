"use client";

import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import { useHostRecapPlayback } from "@/hooks/host/useHostRecapPlayback";
import type { Submission } from "@/types/submission";
import type { RoomTieBreaker } from "@/types/room";
import ExportGameReportButton from "@/components/shared/ExportGameReportButton";
import HostActivePlaybackPanel from "./HostActivePlaybackPanel";
import HostResultsPanel from "./HostResultsPanel";

type HostPlaybackPanelProps = {
	code: string;
	currentSong: Submission | null;
	revealSubmitterName?: string | null;
	revealDetailAnswer?: string | null;
	showRevealDetails?: boolean;
	isPlaying: boolean;
	setIsPlaying: (value: boolean) => void;
	onPrev: () => void;
	onPlayPause: () => void;
	onNext: () => void;
	nextPending?: boolean;
	scores: Record<string, number> | null;
	tieBreaker: RoomTieBreaker;
	tieBreakerStats: Record<string, { fastestCorrectLocks: number }>;
	playedCount: number;
	totalSongs: number;
	allPlayed: boolean;
	recapRunning?: boolean;
	revealRunning?: boolean;
	recapCompleted?: boolean;
	onStartRecap?: () => void;
	onSkipRecap?: () => void;
	onRevealResults: () => void;
	recapSeconds?: number;
};

export default function HostPlaybackPanel({
	code,
	currentSong,
	revealSubmitterName,
	revealDetailAnswer,
	showRevealDetails = false,
	isPlaying,
	setIsPlaying,
	onPrev,
	onPlayPause,
	onNext,
	nextPending = false,
	scores,
	tieBreaker,
	tieBreakerStats,
	playedCount,
	totalSongs,
	allPlayed,
	recapRunning = false,
	revealRunning = false,
	recapCompleted = false,
	onStartRecap,
	onSkipRecap,
	onRevealResults,
	recapSeconds = 15,
}: HostPlaybackPanelProps) {
	const socket = useSocket();
	const { room } = useRoomState();
	const { theme, themeRevealed } = useGameRuntime();
	useThemeSocketSync();

	const playbackHandlers = useHostRecapPlayback({
		currentSongId: currentSong?.id,
		recapRunning: recapRunning || revealRunning,
		recapSeconds,
		setIsPlaying,
		onNext,
	});

	if (!room) {
		return <div className="p-4 text-text/70">Loading room...</div>;
	}

	if (scores) {
		const resultTheme = theme || room.theme || "";
		return (
			<>
				<HostResultsPanel
					code={room.code || code}
					resultsFinalized={room.phase === "ENDED"}
					players={room.players}
					scores={scores}
					tieBreaker={tieBreaker}
					tieBreakerStats={tieBreakerStats}
					theme={resultTheme}
					themeRevealed={themeRevealed}
					onRevealTheme={() => socket.emit("THEME_REVEAL", { code: room.code })}
				/>
				{room.phase === "ENDED" && (
					<div className="flex justify-center">
						<ExportGameReportButton
							code={room.code || code}
							scores={scores}
							theme={resultTheme}
							variant="secondary"
						/>
					</div>
				)}
			</>
		);
	}

	return (
		<HostActivePlaybackPanel
			allPlayed={allPlayed}
			currentSong={currentSong}
			isPlaying={isPlaying}
			playedCount={playedCount}
			recapRunning={recapRunning}
			recapCompleted={recapCompleted}
			revealRunning={revealRunning}
			revealSubmitterName={revealSubmitterName}
			revealDetailAnswer={revealDetailAnswer}
			showRevealDetails={showRevealDetails}
			totalSongs={totalSongs}
			onNext={onNext}
			onPlayPause={onPlayPause}
			onPrev={onPrev}
			nextPending={nextPending}
			onRevealResults={onRevealResults}
			onStartRecap={onStartRecap}
			onSkipRecap={onSkipRecap}
			onDuration={playbackHandlers.handleDuration}
			onEnded={playbackHandlers.handleEnded}
			onProgress={playbackHandlers.handleProgress}
			playerRef={playbackHandlers.playerRef}
		/>
	);
}
