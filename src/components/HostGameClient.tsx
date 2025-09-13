"use client";

// src/components/HostGameClient.tsx

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

import BackgroundShell from "./ui/BackgroundShell";
import LeftSidebar from "./ui/LeftSidebar";
import HostPlaybackPanel from "./host/HostPlaybackPanel";
import HostGamePlaylist from "./host/HostGamePlaylist";

import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useHostGameSocket } from "@/hooks/host/useHostGameSocket";
import { useRevealedSubmittersSync } from "@/hooks/useRevealedSubmittersSync";

import type { Song, Room } from "@/types/room";

export default function HostGameClient({ code, initialRoom }: { code: string; initialRoom?: Room }) {
	const socket = useSocket();
	const {
		room,
		setRoom,
		gameStarted,
		scores,
		revealedSongs,
		setRevealedSongs,
		currentSong,
		submittedPlayers,
		bgThumbnail,
	} = useGame();

	// seed context once after refresh
	useEffect(() => {
		if (initialRoom && !room) setRoom(initialRoom);
	}, [initialRoom, room, setRoom]);

	// Use whichever we have
	const viewRoom = room ?? initialRoom ?? null;

	// Socket listeners for game (host) lifecycle
	useHostGameSocket(code);

	useRevealedSubmittersSync();

	// always join (on first connect and on reconnect)
	useEffect(() => {
		const join = () =>
			socket.emit("joinRoom", { code, name: "Host" }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join room as Host");
			});

		if (socket.connected) join();
		socket.on("connect", join);
		return () => {
			socket.off("connect", join);
		};
	}, [socket, code]);

	// Reconnect banner + auto re-join as "Host"
	const socketError = useReconnectNotice(code, "Host");

	// Local playback UI state
	const [isPlaying, setIsPlaying] = useState(false);

	// Derive current index / totals
	const currentIndex = useMemo(
		() => (currentSong ? room?.songs.findIndex((s) => s.id === currentSong.id) ?? -1 : -1),
		[room, currentSong]
	);
	const totalSongs = room?.songs.length ?? 0;
	const allPlayed = totalSongs > 0 && !!room?.songs.every((s) => revealedSongs.includes(s.id));

	// Centralized play helper that mirrors your socket flow + reveal sync
	const playSong = (song: Song) => {
		socket.emit("playSong", { code, songId: song.id }, () => {
			if (!revealedSongs.includes(song.id)) {
				const updated = [...revealedSongs, song.id];
				setRevealedSongs(updated);
				socket.emit("revealedSongs", { code, revealed: updated });
			}
		});
		setIsPlaying(true);
	};

	const playAtIndex = (idx: number) => {
		if (!viewRoom?.songs[idx]) return;
		playSong(viewRoom.songs[idx]);
	};

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
			if (
				e.code === "ArrowRight" &&
				currentIndex >= 0 &&
				currentIndex < (viewRoom?.songs.length ?? 0) - 1
			) {
				playAtIndex(currentIndex + 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, viewRoom, currentSong]);

	const bgImage = bgThumbnail ?? viewRoom?.backgroundUrl ?? null;

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			<LeftSidebar
				roomCode={viewRoom?.code ?? code}
				players={viewRoom?.players ?? []}
				submittedPlayers={submittedPlayers}
				fallbackName="Host" // your earlier preference
			/>

			<HostPlaybackPanel
				code={code}
				currentSong={currentSong ?? null}
				isPlaying={isPlaying}
				setIsPlaying={setIsPlaying}
				onPrev={() => currentIndex > 0 && playAtIndex(currentIndex - 1)}
				onPlayPause={() => {
					if (!currentSong) playAtIndex(0);
					else setIsPlaying((p) => !p);
				}}
				onNext={() => {
					if (currentIndex >= 0 && currentIndex < (room?.songs.length ?? 0) - 1) {
						playAtIndex(currentIndex + 1);
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
			/>

			<HostGamePlaylist
				songs={viewRoom?.songs ?? []}
				revealedIds={revealedSongs}
				currentSongId={currentSong?.id ?? null}
				onSelect={playSong}
			/>
		</BackgroundShell>
	);
}
