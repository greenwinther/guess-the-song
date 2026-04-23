"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import { useHostRecapPlayback } from "@/hooks/host/useHostRecapPlayback";
import type { Submission } from "@/types/submission";
import type { AdminDashboardPayload } from "@/types/socket";
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

const normalizeAnswer = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

function computeDashboardScores(dashboard: AdminDashboardPayload): Record<string, number> {
	const solvedTheme = new Set(dashboard.theme.solvedBy ?? []);
	const hardcorePlayers = new Set(
		dashboard.players.filter((player) => player.hardcore).map((player) => player.name),
	);

	return Object.fromEntries(
		dashboard.playerHistories.map((history) => {
			let baseScore = 0;
			for (const round of history.rounds) {
				const submitterGuess = normalizeAnswer(round.guessOrder[0]);
				const submitterAnswer = normalizeAnswer(round.correctAnswer);
				if (submitterGuess && submitterGuess === submitterAnswer) baseScore += 1;

				const detailGuess = normalizeAnswer(round.detailGuessOrder[0]);
				const detailAnswer = normalizeAnswer(round.detailCorrectAnswer);
				if (detailGuess && detailAnswer && detailGuess === detailAnswer) baseScore += 1;
			}

			if (solvedTheme.has(history.playerName)) baseScore += 1;

			const total = hardcorePlayers.has(history.playerName)
				? Math.round(baseScore * 1.5 * 100) / 100
				: baseScore;

			return [history.playerName, total];
		}),
	);
}

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
	const [dashboardScores, setDashboardScores] = useState<Record<string, number> | null>(null);
	useThemeSocketSync();

	const [recapTriggered, setRecapTriggered] = useState(false);
	const playbackHandlers = useHostRecapPlayback({
		currentSongId: currentSong?.id,
		recapRunning,
		recapSeconds,
		setIsPlaying,
		onNext,
	});

	const roomCode = room?.code ?? "";

	useEffect(() => {
		if (!scores || !roomCode) {
			setDashboardScores(null);
			return;
		}

		socket.emit("ADMIN_GET_DASHBOARD", { code: roomCode }, (res) => {
			if (!res.ok) {
				setDashboardScores(null);
				return;
			}
			setDashboardScores(computeDashboardScores(res.dashboard));
		});
	}, [socket, scores, roomCode]);

	const hostResultScores = useMemo(() => {
		if (!scores) return null;
		if (!dashboardScores) return scores;

		const names = new Set([...Object.keys(scores), ...Object.keys(dashboardScores)]);
		return Object.fromEntries(
			Array.from(names).map((name) => [
				name,
				Math.max(scores[name] ?? 0, dashboardScores[name] ?? 0),
			]),
		);
	}, [scores, dashboardScores]);

	if (!room) {
		return <div className="p-4 text-text/70">Loading room...</div>;
	}

	if (hostResultScores) {
		const resultTheme = theme || room.theme || "";
		return (
			<>
				<HostResultsPanel
					players={room.players}
					scores={hostResultScores}
					theme={resultTheme}
					themeRevealed={themeRevealed}
					onRevealTheme={() => socket.emit("THEME_REVEAL", { code: room.code })}
				/>
				<div className="mt-4 flex justify-center">
					<ExportGameReportButton
						code={room.code || code}
						scores={hostResultScores}
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
