"use client";

// src/components/HostControlGameView.tsx

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import BackgroundShell from "@/components/shared/BackgroundShell";
import RoomSidebar from "@/components/shared/RoomSidebar";

import HostPlaybackPanel from "@/components/host/components/HostPlaybackPanel";
import HostRevealPlaylistPanel from "@/components/host/components/HostRevealPlaylistPanel";

import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useHostGameSocket } from "@/hooks/control/useHostGameSocket";
import { useRevealedSubmittersSync } from "@/hooks/useRevealedSubmittersSync";
import { useRevealedSongsSync } from "@/hooks/player/useRevealedSongsSync";

import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import { useThemeSockets } from "@/hooks/useThemeSockets";

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

	useThemeSockets();

	const [recapRunning, setRecapRunning] = useState(false);
	const [fastRecap, setFastRecap] = useState<boolean>(() => {
		// optional persist
		if (typeof window === "undefined") return false;
		return localStorage.getItem("gts_fast_recap") === "1";
	});
	const [showDebug, setShowDebug] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem("gts_debug_panel") !== "0";
	});

	const [lockedBySong, setLockedBySong] = useState<Map<number, Set<string>>>(
		new Map<number, Set<string>>()
	);

	// seed context once after refresh
	useEffect(() => {
		if (initialRoom) setRoom(initialRoom);
	}, [initialRoom, setRoom]);

	// Use whichever we have
	const viewRoom = room ?? initialRoom ?? null;

	// Socket listeners for game (host) lifecycle
	useHostGameSocket(code);
	useRevealedSongsSync();
	useRevealedSubmittersSync();

	useEffect(() => {
		localStorage.setItem("gts_fast_recap", fastRecap ? "1" : "0");
	}, [fastRecap]);

	useEffect(() => {
		localStorage.setItem("gts_debug_panel", showDebug ? "1" : "0");
	}, [showDebug]);

	const recapSeconds = fastRecap ? 15 : 30;

	const lockedCounts = useMemo(() => {
		const acc: Record<string, number> = {};
		lockedBySong.forEach((names) => {
			names.forEach((n) => {
				acc[n] = (acc[n] || 0) + 1;
			});
		});
		return acc;
	}, [lockedBySong]);

	useEffect(() => {
		if (!socket) return;

		const onPlayerGuessLocked = ({ songId, playerName }: { songId: number; playerName: string }) => {
			setLockedBySong((prev) => {
				const m = new Map(prev);
				const s = new Set<string>(m.get(songId) ?? new Set<string>());
				s.add(playerName);
				m.set(songId, s);
				return m;
			});
		};

		const onPlayerGuessUndo = ({ songId, playerName }: { songId: number; playerName: string }) => {
			setLockedBySong((prev) => {
				const m = new Map(prev);
				const s = new Set<string>(m.get(songId) ?? new Set<string>());
				s.delete(playerName);
				m.set(songId, s);
				return m;
			});
		};

		const onSongFinalized = ({ songId, lockedNames }: { songId: number; lockedNames?: string[] }) => {
			if (!lockedNames?.length) return;
			setLockedBySong((prev) => {
				const m = new Map(prev);
				const s = new Set<string>(m.get(songId) ?? new Set<string>());
				lockedNames.forEach((n) => s.add(n));
				m.set(songId, s);
				return m;
			});
		};

		socket.on("playerGuessLocked", onPlayerGuessLocked);
		socket.on("playerGuessUndo", onPlayerGuessUndo);
		socket.on("songFinalized", onSongFinalized);
		return () => {
			socket.off("playerGuessLocked", onPlayerGuessLocked);
			socket.off("playerGuessUndo", onPlayerGuessUndo);
			socket.off("songFinalized", onSongFinalized);
		};
	}, [socket]);

	// Reconnect banner + auto re-join as "Host"
	const socketError = useReconnectNotice();

	// Local playback UI state
	const [isPlaying, setIsPlaying] = useState(false);

	const roomSongs = viewRoom?.songs;
	const songs = useMemo(() => roomSongs ?? [], [roomSongs]);

	// Derive these like before
	const currentIndex = useMemo(
		() => (currentSong ? songs.findIndex((s) => s.id === currentSong.id) : -1),
		[songs, currentSong]
	);

	const totalSongs = room?.songs.length ?? 0;
	const allPlayed = totalSongs > 0 && !!room?.songs.every((s) => revealedSongs.includes(s.id));

	// Centralized play helper that mirrors your socket flow + reveal sync
	const playSong = useCallback(
		(song: Submission) => {
			socket.emit("playSong", { code, songId: song.id }, () => {
				if (!revealedSongs.includes(song.id)) {
					const updated = [...revealedSongs, song.id];
					setRevealedSongs(updated);
					socket.emit("revealedSongs", { code, revealed: updated });
				}
			});
			setIsPlaying(true);
		},
		[socket, code, revealedSongs, setRevealedSongs]
	);

	const playAtIndex = useCallback(
		(idx: number) => {
			if (!songs[idx]) return;
			playSong(songs[idx]);
		},
		[songs, playSong]
	);

	// For the ArrowRight bound check
	const songsLen = songs.length;

	// Keyboard shortcuts
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (!t) return;
			if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

			if (e.code === "Space") {
				e.preventDefault();
				if (!currentSong) playAtIndex(0);
				else setIsPlaying((p) => !p);
			}
			if (e.code === "ArrowLeft" && currentIndex > 0) playAtIndex(currentIndex - 1);
			if (e.code === "ArrowRight" && currentIndex >= 0 && currentIndex < songsLen - 1) {
				playAtIndex(currentIndex + 1);
			}
			if (e.code === "KeyD") {
				setShowDebug((prev) => !prev);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, currentSong, songsLen, playAtIndex]);

	const bgImage = bgThumbnail ?? viewRoom?.backgroundUrl ?? null;
	const currentLockedNames = Array.from(
		lockedBySong.get(currentSong?.id ?? -1) ?? new Set<string>()
	);
	const isDev = process.env.NODE_ENV !== "production";

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
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
					const ok = window.confirm(`Kick ${player.name}?`);
					if (!ok) return;
					socket.emit("kickPlayer", { code: viewRoom?.code ?? code, playerName: player.name }, (success) => {
						if (!success) alert("Failed to kick player");
					});
				}}
			/>

			<HostPlaybackPanel
				code={code}
				currentSong={currentSong ?? null}
				isPlaying={isPlaying}
				setIsPlaying={setIsPlaying}
				onPrev={() => currentIndex > 0 && playAtIndex(currentIndex - 1)}
				onPlayPause={() => {
					if (!currentSong) {
						playAtIndex(0);
						return;
					}
					if (!currentClip || currentClip.songId !== currentSong.id) {
						playSong(currentSong);
						return;
					}
					setIsPlaying((p) => !p);
				}}
				onNext={() => {
					// 1) ask server to finalize HC + advance round
					socket.emit("nextSong", { code }, () => {});

					// 2) keep your current local playback behavior
					const lastIdx = (room?.songs.length ?? 0) - 1;
					if (currentIndex >= 0 && currentIndex < lastIdx) {
						playAtIndex(currentIndex + 1);
					} else {
						if (recapRunning) setRecapRunning(false);
						setIsPlaying(false);
					}
				}}
				scores={scores}
				playedCount={
					revealedSongs.filter((id) => (viewRoom?.songs ?? []).some((s) => s.id === id)).length
				}
				totalSongs={totalSongs}
				allPlayed={allPlayed}
				onShowResults={() => {
					socket.emit("showResults", { code }, (ok: boolean) => {
						if (!ok) alert("Failed to show results");
					});
				}}
				recapRunning={recapRunning}
				onStartRecap={() => {
					setRecapRunning(true);
					if (songs.length > 0) {
						// Always start recap from the first track
						playAtIndex(0);
					}
				}}
				onStopRecap={() => setRecapRunning(false)}
				recapSeconds={recapSeconds}
				fastRecap={fastRecap}
				onToggleFastRecap={setFastRecap}
			/>

			<HostRevealPlaylistPanel
				songs={viewRoom?.songs ?? []}
				revealedIds={revealedSongs}
				currentSongId={currentSong?.id ?? null}
				onSelect={playSong}
				allPlayed={allPlayed}
			/>

			{isDev && showDebug && (
				<div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-border bg-card/90 p-3 text-xs text-text shadow-xl backdrop-blur">
					<div className="mb-2 text-[10px] uppercase tracking-widest text-text/60">Debug</div>
					<div>Room: {viewRoom?.code ?? code}</div>
					<div>Phase: {viewRoom?.phase ?? "?"}</div>
					<div>
						Active song: {currentSong ? `${currentIndex + 1}/${songs.length}` : "none"}
					</div>
					<div>Revealed: {revealedSongs.length}</div>
					<div>Players: {viewRoom?.players?.length ?? 0}</div>
					<div>Locked this round: {lockedForThisRound.length}</div>
					<div className="mt-2">
						<button
							className="rounded-md border border-border bg-card/80 px-2 py-1 text-[10px] uppercase tracking-widest text-text/80 hover:bg-card"
							onClick={() => {
								socket.emit("DEV_RESYNC", { code: viewRoom?.code ?? code }, (ok) => {
									if (!ok) alert("Resync failed");
								});
							}}
						>
							Force resync
						</button>
						<button
							className="ml-2 rounded-md border border-border bg-card/80 px-2 py-1 text-[10px] uppercase tracking-widest text-text/80 hover:bg-card"
							onClick={() => {
								socket.emit("DEV_SNAPSHOT", { code: viewRoom?.code ?? code }, (ok) => {
									if (!ok) alert("Snapshot failed");
								});
							}}
						>
							Dump snapshot
						</button>
					</div>
					<div className="mt-2 text-[10px] text-text/60">Press D to toggle</div>
				</div>
			)}
		</BackgroundShell>
	);
}
