"use client";
// src/components/HostGameClient.tsx

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Song } from "@/types/room";
import ReactPlayer from "react-player";
import Button from "./ui/Button";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [currentSong, setCurrentSong] = useState<Song | null>(null);

	// subscribe to round events (if still used)
	useEffect(() => {
		socket.on("startGame", (round) => {
			dispatch({ type: "ROUND_STARTED", payload: round });
		});
		socket.on("showResults", ({ correctAnswer, scores }) => {
			dispatch({ type: "ROUND_ENDED", payload: { correctAnswer, scores } });
		});
		socket.on("playerJoined", (player: Player) => {
			console.log("👤 [client] playerJoined received:", player);
			dispatch({ type: "ADD_PLAYER", player });
		});
		return () => {
			socket.off("startGame");
			socket.off("showResults");
			socket.off("playerJoined");
		};
	}, [socket, dispatch]);

	// handler to play a selected song
	const handlePlay = (song: Song) => {
		setCurrentSong(song);
		socket.emit("startGame", { code, songId: song.id }, (res: { success: boolean; error?: string }) => {
			if (!res.success) alert("Could not play song: " + res.error);
		});
	};

	// handler to end the game
	const handleEndGame = () => {
		socket.emit("showResults", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to end game");
			// maybe navigate or show a final summary
		});
	};

	if (!state.room) {
		return <p>Loading game...</p>;
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
					<h2 className="text-2xl font-semibold text-text mb-4">
						{currentSong ? currentSong.submitter : "Submitter Name"}
					</h2>

					<div className="w-full rounded-lg overflow-hidden mb-4 border border-border">
						{currentSong ? (
							<ReactPlayer url={currentSong.url} controls playing width="100%" height="360px" />
						) : (
							<div className="w-full h-64 bg-[#000]" />
						)}
					</div>

					<div className="flex gap-4">
						<Button variant="secondary" size="md" onClick={handleEndGame}>
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
								{s.title ?? s.url}
							</Button>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
