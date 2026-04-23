"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import { useHostRecapPlayback } from "@/hooks/host/useHostRecapPlayback";
import type { Submission } from "@/types/submission";
import ExportGameReportButton from "@/components/shared/ExportGameReportButton";
import HostActivePlaybackPanel from "./HostActivePlaybackPanel";
import HostResultsPanel from "./HostResultsPanel";

type HostPlaybackPanelProps = {
	code: string;
	currentSong: Submission | null;
	isPlaying: boolean;
	setIsPlaying: (value: boolean) => void;
	onPrev: () => void;
	onPlayPause: () => void;
	onNext: () => void;
	scores: Record<string, number> | null;
	playedCount: number;
	totalSongs: number;
	allPlayed: boolean;
	onShowResults: () => void;
	recapRunning?: boolean;
	onStartRecap?: (fast: boolean) => void;
	onStopRecap?: () => void;
	recapSeconds?: number;
};

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
	recapRunning = false,
	onStartRecap,
	onStopRecap,
	recapSeconds = 30,
}: HostPlaybackPanelProps) {
	const socket = useSocket();
	const { room } = useRoomState();
	const { theme, themeRevealed } = useGameRuntime();
	useThemeSocketSync();

	const [recapTriggered, setRecapTriggered] = useState(false);
	const playbackHandlers = useHostRecapPlayback({
		currentSongId: currentSong?.id,
		recapRunning,
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
					players={room.players}
					scores={scores}
					theme={resultTheme}
					themeRevealed={themeRevealed}
					onRevealTheme={() => socket.emit("THEME_REVEAL", { code: room.code })}
				/>
				<div className="mt-4 flex justify-center">
					<ExportGameReportButton
						code={room.code || code}
						scores={scores}
						theme={resultTheme}
						variant="secondary"
					/>
				</div>
			</>
		);
	}

	const handleStartRecap = (fast: boolean) => {
		setRecapTriggered(true);
		onStartRecap?.(fast);
	};

	return (
		<HostActivePlaybackPanel
			allPlayed={allPlayed}
			currentSong={currentSong}
			isPlaying={isPlaying}
			playedCount={playedCount}
			recapRunning={recapRunning}
			recapTriggered={recapTriggered}
			totalSongs={totalSongs}
			onNext={onNext}
			onPlayPause={onPlayPause}
			onPrev={onPrev}
			onShowResults={onShowResults}
			onStartRecap={handleStartRecap}
			onStopRecap={onStopRecap}
			onDuration={playbackHandlers.handleDuration}
			onEnded={playbackHandlers.handleEnded}
			onProgress={playbackHandlers.handleProgress}
			playerRef={playbackHandlers.playerRef}
		/>
	);
}
