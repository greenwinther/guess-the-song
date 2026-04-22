"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import { useHostRecapPlayback } from "@/hooks/host/useHostRecapPlayback";
import type { Submission } from "@/types/submission";
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
	onStartRecap?: () => void;
	onStopRecap?: () => void;
	recapSeconds?: number;
	fastRecap?: boolean;
	onToggleFastRecap?: (checked: boolean) => void;
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
	fastRecap = false,
	onToggleFastRecap,
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
		return (
			<HostResultsPanel
				code={code}
				roomCode={room.code}
				scores={scores}
				theme={theme}
				themeRevealed={themeRevealed}
				onRevealTheme={() => socket.emit("THEME_REVEAL", { code: room.code })}
			/>
		);
	}

	const handleStartRecap = () => {
		setRecapTriggered(true);
		onStartRecap?.();
	};

	return (
		<HostActivePlaybackPanel
			allPlayed={allPlayed}
			currentSong={currentSong}
			fastRecap={fastRecap}
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
			onToggleFastRecap={onToggleFastRecap}
			onDuration={playbackHandlers.handleDuration}
			onEnded={playbackHandlers.handleEnded}
			onProgress={playbackHandlers.handleProgress}
			playerRef={playbackHandlers.playerRef}
		/>
	);
}
