"use client";
// src/components/HostGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";
import ReactPlayer from "react-player";
import Button from "./ui/Button";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [currentSong, setCurrentSong] = useState<Song | null>(null);
	const [showSubmitter, setShowSubmitter] = useState(false);
	const [revealedSongs, setRevealedSongs] = useState<number[]>([]);
	const hasJoined = useRef(false);

	// 1) On game start, seed context
	useEffect(() => {
		const onGameStarted = (room: Room) => {
			dispatch({ type: "SET_ROOM", room });
			dispatch({ type: "START_GAME" });
		};
		socket.on("gameStarted", onGameStarted);
		return () => {
			socket.off("gameStarted", onGameStarted);
		};
	}, [socket, dispatch]);

	// 2) Listen for new players joining (so host sees updated player list)
	useEffect(() => {
		if (hasJoined.current) return; // Only join once
		const onPlayerJoined = (player: Player) => {
			// If we already have that player.id, skip
			if (!state.room?.players.find((p) => p.id === player.id)) {
				dispatch({ type: "ADD_PLAYER", player });
			}
		};
		socket.on("playerJoined", onPlayerJoined);
		hasJoined.current = true; // Mark as joined
		return () => {
			socket.off("playerJoined", onPlayerJoined);
		};
	}, [socket, dispatch, state.room]);

	// 2) On each playSong, update clip locally and in context
	useEffect(() => {
		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			// update context currentClip
			dispatch({ type: "PLAY_SONG", payload: { songId, clipUrl } });
			// reset reveal
			setShowSubmitter(false);
			// find full song object
			const s = state.room?.songs.find((x) => x.id === songId) || null;
			setCurrentSong(s);
		};
		socket.on("playSong", onPlaySong);
		return () => {
			socket.off("playSong", onPlaySong);
		};
	}, [socket, dispatch, state.room]);

	// 3) Host triggers clip
	const handlePlay = (song: Song) => {
		socket.emit("playSong", { code, songId: song.id }, (res: { success: boolean; error?: string }) => {
			if (!res.success) {
				alert("Could not play that song: " + res.error);
			} else {
				setRevealedSongs((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
			}
		});
	};

	// 4) When host is ready, show final results
	const handleShowResults = () => {
		socket.emit("showResults", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to show results");
		});
	};

	if (!state.room || !state.gameStarted) {
		return <p>Loading game…</p>;
	}

	// If gameOver, show results
	if (state.scores) {
		// Sort players by descending score
		const ranking = Object.entries(state.scores).sort(([, a], [, b]) => b - a);

		return (
			<div className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary">
				<div className="max-w-md mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl p-6 text-center">
					<h2 className="text-2xl font-semibold text-text mb-4">Final Results</h2>
					<ol className="list-decimal list-inside space-y-2 text-text">
						{ranking.map(([name, pts], idx) => (
							<li key={name} className="flex justify-between">
								<span>{name}</span>
								<span>{pts} pts</span>
							</li>
						))}
					</ol>
				</div>
			</div>
		);
	}

	return (
		<div
			className="
        min-h-screen p-8 
        bg-gradient-to-br from-bg to-secondary 
        bg-no-repeat bg-cover bg-center
      "
			style={{
				backgroundImage: `url(${state.room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/* Sidebar */}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border flex flex-col items-center">
					<h1 className="text-3xl font-bold text-text mb-4">
						Guess <span className="text-secondary underline decoration-highlight">the</span> Song
					</h1>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg p-4 text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{state.room.code}</p>
					</div>
					<ul className="space-y-2 w-full">
						{state.room.players.map((p) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</aside>

				{/* Center panel */}
				<main className="flex-1 p-6 flex flex-col items-center">
					{/* Click to reveal submitter */}
					<h2
						className="text-2xl font-semibold text-text cursor-pointer select-none"
						onClick={() => setShowSubmitter(true)}
					>
						{showSubmitter && currentSong ? currentSong.submitter : "Click to reveal submitter"}
					</h2>

					<div className="w-full rounded-lg overflow-hidden border border-border mt-6 mb-6 h-96">
						{currentSong ? (
							<ReactPlayer url={currentSong.url} controls playing width="100%" height="100%" />
						) : (
							<div className="w-full h-full bg-[#000]" />
						)}
					</div>

					<div className="flex gap-4">
						<Button variant="secondary" size="md" onClick={handleShowResults}>
							Show Results
						</Button>
					</div>
				</main>

				{/* Right sidebar */}
				<aside className="w-1/4 p-6 border-l border-border flex flex-col">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="space-y-3 flex-1 overflow-y-auto">
						{state.room.songs.map((s) => (
							<Button
								key={s.id}
								variant={currentSong?.id === s.id ? "primary" : "secondary"}
								size="sm"
								className="w-full justify-start"
								onClick={() => handlePlay(s)}
							>
								{revealedSongs.includes(s.id) ? s.title ?? s.url : "Click to reveal song"}
							</Button>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
