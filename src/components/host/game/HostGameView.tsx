"use client";

// src/components/host/game/HostGameView.tsx

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

export default function HostGameView({
	code,
	initialRoom,
}: {
	code: string;
	initialRoom?: Room;
}) {
	const socket = useSocket();
	const { room, setRoom } = useRoomState();
	const {
		scores,
		revealedSongs,
		setRevealedSongs,
		currentSong,
		currentClip,
		submittedPlayers,
		bgThumbnail,
		solvedByTheme,
		lockedForThisRound,
	} = useGameRuntime();

	useThemeSocketSync();

	const [recapRunning, setRecapRunning] = useState(false);
	const [playerToKick, setPlayerToKick] = useState<Member | null>(null);
	const [fastRecap, setFastRecap] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("gts_fast_recap") === "1";
	});
	const { showDebug, toggleDebug } = useHostDebugVisibility();

	useEffect(() => {
		if (initialRoom) setRoom(initialRoom);
	}, [initialRoom, setRoom]);

	const viewRoom = room ?? initialRoom ?? null;

	useHostGameSocket(code);
	useRevealedSongsSync();
	useHostRevealedSubmittersSync();

	useEffect(() => {
		localStorage.setItem("gts_fast_recap", fastRecap ? "1" : "0");
	}, [fastRecap]);

	const recapSeconds = fastRecap ? 15 : 30;

	const socketError = useReconnectNotice();

	const roomSongs = viewRoom?.songs;
	const songs = useMemo(() => roomSongs ?? [], [roomSongs]);

	const totalSongs = room?.songs.length ?? 0;
	const allPlayed = totalSongs > 0 && !!room?.songs.every((s) => revealedSongs.includes(s.id));
	const { currentLockedNames, lockedCounts } = useHostLockedGuesses(currentSong?.id);
	const {
		currentIndex,
		isPlaying,
		playNext,
		playOrPause,
		playPrevious,
		playSong,
		setIsPlaying,
	} = useHostPlaybackControls({
		code,
		currentClip,
		currentSong,
		recapRunning,
		revealedSongs,
		setRevealedSongs,
		songs,
		totalSongs,
		onStopRecap: () => setRecapRunning(false),
		onToggleDebug: toggleDebug,
	});

	const bgImage = bgThumbnail ?? viewRoom?.backgroundUrl ?? null;
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

			<main className="lg:col-span-6 p-4 pt-6 sm:p-4 flex flex-col">
				<HostPlaybackPanel
					code={code}
					currentSong={currentSong ?? null}
					isPlaying={isPlaying}
					setIsPlaying={setIsPlaying}
					onPrev={playPrevious}
					onPlayPause={playOrPause}
					onNext={playNext}
					scores={scores}
					playedCount={
						revealedSongs.filter((id) =>
							(viewRoom?.songs ?? []).some((s) => s.id === id)
						).length
					}
					totalSongs={totalSongs}
					allPlayed={allPlayed}
					onShowResults={() => {
						socket.emit("showResults", { code }, (ok: boolean) => {
							if (!ok) toast.error("Failed to show results.");
						});
					}}
					recapRunning={recapRunning}
					onStartRecap={(fast) => {
						setFastRecap(fast);
						setRecapRunning(true);
						if (songs.length > 0) {
							playSong(songs[0]);
						}
					}}
					onStopRecap={() => setRecapRunning(false)}
					recapSeconds={recapSeconds}
				/>
			</main>

			<HostPlaylistPanel
				songs={viewRoom?.songs ?? []}
				revealedIds={revealedSongs}
				currentSongId={currentSong?.id ?? null}
				onSelect={playSong}
				allPlayed={allPlayed}
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
