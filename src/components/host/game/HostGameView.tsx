"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import BackgroundShell from "@/components/shared/BackgroundShell";
import RoomSidebar from "@/components/shared/RoomSidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

import HostDebugPanel from "@/components/host/game/HostDebugPanel";
import HostPlaybackPanel from "@/components/host/game/playback/HostPlaybackPanel";
import HostPlaylistPanel from "@/components/host/common/HostPlaylistPanel";

import { useReconnectNotice } from "@/hooks/shared/useReconnectNotice";
import { useHostDebugVisibility } from "@/hooks/host/useHostDebugVisibility";
import { useHostLockedGuesses } from "@/hooks/host/useHostLockedGuesses";
import { useHostPlaybackControls } from "@/hooks/host/useHostPlaybackControls";
import { useHostGameSocket } from "@/hooks/host/useHostGameSocket";
import { useHostRevealedSubmittersSync } from "@/hooks/host/useHostRevealedSubmittersSync";
import { useRevealedSongsSync } from "@/hooks/player/useRevealedSongsSync";

import type { Room } from "@/types/room";
import type { Member } from "@/types/member";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import {
	CENTER_GAME_PANEL_CLASS,
	ROOM_SHELL_HEIGHT_CLASS,
} from "@/components/shared/layout/panelClassNames";

const RECAP_CLIP_SECONDS = 15;
const REVEAL_CLIP_SECONDS = 30;
const REVEAL_DETAILS_DELAY_MS = 7000;

export default function HostGameView({
	code,
	initialRoom,
	hostToken,
	onJoinSuccess,
}: {
	code: string;
	initialRoom?: Room;
	hostToken?: string | null;
	onJoinSuccess?: () => void;
}) {
	const socket = useSocket();
	const { room, setRoom } = useRoomState();
	const {
		scores,
		finalTieBreaker,
		finalTieBreakerStats,
		revealedSongs,
		revealedSubmitters,
		setRevealedSongs,
		currentSong,
		currentClip,
		submittedPlayers,
		bgThumbnail,
		useSongArtworkBackground,
		setUseSongArtworkBackground,
		solvedByTheme,
		lockedForThisRound,
	} = useGameRuntime();

	useThemeSocketSync();

	const [recapRunning, setRecapRunning] = useState(false);
	const [revealRunning, setRevealRunning] = useState(false);
	const [recapCompleted, setRecapCompleted] = useState(false);
	const [showRevealDetails, setShowRevealDetails] = useState(false);
	const [playerToKick, setPlayerToKick] = useState<Member | null>(null);
	const { showDebug, toggleDebug } = useHostDebugVisibility();

	useEffect(() => {
		if (initialRoom) setRoom(initialRoom);
	}, [initialRoom, setRoom]);

	const viewRoom = room ?? initialRoom ?? null;
	const phase = viewRoom?.phase ?? "LOBBY";
	const isRevealPhase = phase === "REVEAL";
	const currentSongId = currentSong?.id ?? null;

	useHostGameSocket(code, hostToken, { onJoinSuccess });
	useRevealedSongsSync();
	useHostRevealedSubmittersSync();

	const recapSeconds = isRevealPhase || revealRunning ? REVEAL_CLIP_SECONDS : RECAP_CLIP_SECONDS;
	const socketError = useReconnectNotice();

	const roomSongs = viewRoom?.songs;
	const songs = useMemo(() => roomSongs ?? [], [roomSongs]);

	const totalSongs = room?.songs.length ?? 0;
	const allPlayed = totalSongs > 0 && !!room?.songs.every((song) => revealedSongs.includes(song.id));
	const { currentLockedNames, lockedCounts } = useHostLockedGuesses(currentSong?.id);
	const {
		currentIndex,
		isPlaying,
		nextPending,
		playNext,
		playOrPause,
		playPrevious,
		playSong,
		setIsPlaying,
	} = useHostPlaybackControls({
		code,
		currentClip,
		currentSong,
		recapRunning: recapRunning || isRevealPhase,
		revealedSongs,
		setRevealedSongs,
		songs,
		totalSongs,
		onStopRecap: () => {
			if (recapRunning) {
				setRecapRunning(false);
				setRecapCompleted(true);
			}
			if (revealRunning) {
				setRevealRunning(false);
			}
		},
		onToggleDebug: toggleDebug,
	});

	useEffect(() => {
		if (!isRevealPhase || !currentSong) return;
		if (revealedSubmitters.includes(currentSong.id)) return;
		socket.emit("revealSubmitter", { code, songId: currentSong.id });
	}, [socket, code, isRevealPhase, currentSong, revealedSubmitters]);

	useEffect(() => {
		if (!isRevealPhase || currentSongId == null) {
			setShowRevealDetails(false);
			return;
		}
		setShowRevealDetails(false);
		const timer = window.setTimeout(() => {
			setShowRevealDetails(true);
		}, REVEAL_DETAILS_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [isRevealPhase, currentSongId]);

	const ensureRecapPhase = (onReady: () => void) => {
		if (phase === "RECAP") {
			onReady();
			return;
		}
		socket.emit("beginRecap", { code }, (ok?: boolean) => {
			if (!ok) {
				toast.error("Could not enter recap mode.");
				return;
			}
			onReady();
		});
	};

	const bgImage = useSongArtworkBackground
		? (bgThumbnail ?? viewRoom?.backgroundUrl ?? null)
		: (viewRoom?.backgroundUrl ?? null);
	const isDev = process.env.NODE_ENV !== "production";
	const confirmKick = () => {
		if (!playerToKick) return;
		const playerName = playerToKick.name;
		const roomCode = viewRoom?.code ?? code;
		setPlayerToKick(null);
		socket.emit("kickPlayer", { code: roomCode, playerName }, (success) => {
			if (!success) toast.error("Failed to kick player.");
		});
	};

	return (
		<BackgroundShell
			bgImage={bgImage}
			socketError={socketError}
			shellSize="cinema"
			transitionPreset="cinema-enter"
			contentClassName={ROOM_SHELL_HEIGHT_CLASS}
		>
			<RoomSidebar
				roomCode={viewRoom?.code ?? code}
				players={viewRoom?.players ?? []}
				submittedPlayers={submittedPlayers}
				fallbackName="Host"
				lockedNames={currentLockedNames}
				lockedCounts={lockedCounts}
				solvedByTheme={solvedByTheme}
				lockedForThisRound={lockedForThisRound}
				onKick={(player) => {
					setPlayerToKick(player);
				}}
			/>
			<ConfirmDialog
				open={Boolean(playerToKick)}
				title="Kick player?"
				description={
					playerToKick
						? `Remove ${playerToKick.name} from this room?`
						: "Remove this player from the room?"
				}
				confirmLabel="Kick"
				confirmVariant="danger"
				onConfirm={confirmKick}
				onCancel={() => setPlayerToKick(null)}
			/>

			<main className={`${CENTER_GAME_PANEL_CLASS} gap-4`}>
				<HostPlaybackPanel
					code={code}
					currentSong={currentSong ?? null}
					revealSubmitterName={isRevealPhase ? (currentSong?.submitter ?? null) : null}
					revealDetailAnswer={
						isRevealPhase ? ((currentSong?.detailAnswer ?? "").trim() || null) : null
					}
					showRevealDetails={showRevealDetails}
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					onPrev={playPrevious}
					onPlayPause={playOrPause}
					onNext={playNext}
					nextPending={nextPending}
					scores={scores}
					tieBreaker={finalTieBreaker}
					tieBreakerStats={finalTieBreakerStats}
					playedCount={revealedSongs.filter((id) => (viewRoom?.songs ?? []).some((s) => s.id === id)).length}
					totalSongs={totalSongs}
					allPlayed={allPlayed}
					onRevealResults={() => {
						socket.emit("showResults", { code }, (ok: boolean) => {
							if (!ok) {
								toast.error("Failed to show results.");
								return;
							}
							setRevealRunning(true);
							setRecapRunning(false);
							if (songs.length > 0) {
								playSong(songs[0]);
							}
						});
					}}
					recapRunning={recapRunning}
					revealRunning={isRevealPhase || revealRunning}
					recapCompleted={recapCompleted}
					onStartRecap={() => {
						ensureRecapPhase(() => {
							setRecapRunning(true);
							setRevealRunning(false);
							setRecapCompleted(false);
							if (songs.length > 0) {
								playSong(songs[0]);
							}
						});
					}}
					onSkipRecap={() => {
						ensureRecapPhase(() => {
							setRecapRunning(false);
							setRevealRunning(false);
							setRecapCompleted(true);
							setIsPlaying(false);
						});
					}}
					recapSeconds={recapSeconds}
				/>
			</main>

			<HostPlaylistPanel
				songs={viewRoom?.songs ?? []}
				revealedIds={revealedSongs}
				currentSongId={currentSong?.id ?? null}
				onSelect={playSong}
				allPlayed={allPlayed}
				showRevealControls={false}
				useSongArtworkBackground={useSongArtworkBackground}
				onToggleSongArtworkBackground={() => setUseSongArtworkBackground((current) => !current)}
			/>

			{isDev && showDebug && (
				<HostDebugPanel
					code={code}
					currentIndex={currentIndex}
					currentSong={currentSong ?? null}
					lockedForThisRound={lockedForThisRound}
					revealedCount={revealedSongs.length}
					room={viewRoom}
					songCount={songs.length}
				/>
			)}
		</BackgroundShell>
	);
}
