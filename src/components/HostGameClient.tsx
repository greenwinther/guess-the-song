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

import type { Song } from "@/types/room";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const {
		room,
		gameStarted,
		scores,
		revealedSongs,
		setRevealedSongs,
		currentSong,
		submittedPlayers,
		bgThumbnail,
	} = useGame();

	// Socket listeners for game (host) lifecycle
	useHostGameSocket(code);

	useRevealedSubmittersSync();

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
		if (!room?.songs[idx]) return;
		playSong(room.songs[idx]);
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
			if (e.code === "ArrowLeft") {
				if (currentIndex > 0) playAtIndex(currentIndex - 1);
			}
			if (e.code === "ArrowRight") {
				if (currentIndex >= 0 && currentIndex < (room?.songs.length ?? 0) - 1) {
					playAtIndex(currentIndex + 1);
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, room, currentSong]); // isPlaying not needed for handlers

	if (!room || !gameStarted) return <p>Loading game…</p>;

	const bgImage = bgThumbnail ?? room.backgroundUrl ?? null;

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			<LeftSidebar roomCode={room.code} players={room.players} submittedPlayers={submittedPlayers} />

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
				playedCount={revealedSongs.filter((id) => room.songs.some((s) => s.id === id)).length}
				totalSongs={totalSongs}
				allPlayed={allPlayed}
				onShowResults={() => {
					socket.emit("showResults", { code }, (ok: boolean) => {
						if (!ok) alert("Failed to show results");
					});
				}}
			/>

			<HostGamePlaylist
				songs={room.songs}
				revealedIds={revealedSongs}
				currentSongId={currentSong?.id ?? null}
				onSelect={playSong}
			/>
		</BackgroundShell>
	);
}
