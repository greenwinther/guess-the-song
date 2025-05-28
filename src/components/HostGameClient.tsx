"use client";
// src/components/HostGameClient.tsx

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Song } from "@/types/room";
import ReactPlayer from "react-player";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [currentSong, setCurrentSong] = useState<Song | null>(null);

	// subscribe to round events (if still used)
	useEffect(() => {
		socket.on("roundStarted", (round) => {
			dispatch({ type: "ROUND_STARTED", payload: round });
		});
		socket.on("roundEnded", ({ correctAnswer, scores }) => {
			dispatch({ type: "ROUND_ENDED", payload: { correctAnswer, scores } });
		});
		return () => {
			socket.off("roundStarted");
			socket.off("roundEnded");
		};
	}, [socket, dispatch]);

	// handler to play a selected song
	const handlePlay = (song: Song) => {
		setCurrentSong(song);
		socket.emit("startRound", { code, songId: song.id }, (res: { success: boolean; error?: string }) => {
			if (!res.success) alert("Could not play song: " + res.error);
		});
	};

	// handler to end the game
	const handleEndGame = () => {
		socket.emit("endGame", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to end game");
			// maybe navigate or show a final summary
		});
	};

	if (!state.room) {
		return <p>Loading game...</p>;
	}

	return (
		<div className="min-h-screen p-8 bg-gray-100">
			<header className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Host Game - {state.room.theme}</h1>
				<div>
					Code: <strong>{state.room.code}</strong>
				</div>
			</header>

			<div className="flex gap-8">
				{/* Sidebar: list of songs */}
				<aside className="w-1/3 bg-white rounded shadow p-4">
					<h2 className="text-xl mb-4">Song Library</h2>
					<ul className="space-y-2 max-h-[60vh] overflow-y-auto">
						{state.room.songs.map((s) => (
							<li key={s.id} className="flex justify-between items-center">
								<span className="truncate">{s.url}</span>
								<button onClick={() => handlePlay(s)} className="btn btn-sm">
									Play
								</button>
							</li>
						))}
					</ul>
				</aside>

				{/* Main area: current song and players */}
				<main className="flex-1 bg-white rounded shadow p-6 flex flex-col">
					<div className="flex-1 mb-4">
						{currentSong ? (
							<div>
								<h3 className="text-2xl mb-2">Now Playing</h3>
								{currentSong ? (
									<div>
										<h3 className="text-2xl mb-2">Now Playing</h3>
										<ReactPlayer
											url={currentSong.url}
											controls
											playing
											width="100%"
											height="360px"
										/>
									</div>
								) : (
									<p className="text-gray-500">Select a song to play</p>
								)}
							</div>
						) : (
							<p className="text-gray-500">Select a song to play</p>
						)}
					</div>

					<div>
						<h2 className="text-xl mb-2">Players</h2>
						<ul className="list-disc pl-5 space-y-1">
							{state.room.players.map((p) => (
								<li key={p.id}>{p.name}</li>
							))}
						</ul>
					</div>

					<button onClick={handleEndGame} className="mt-6 btn btn-danger self-end">
						End Game
					</button>
				</main>
			</div>
		</div>
	);
}
