//src/app/game/[roomId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useRouter } from "next/navigation";
import { Player } from "@/types/game";

export default function GamePage() {
	const { roomId } = useParams();
	const router = useRouter();

	const [players, setPlayers] = useState<Player[]>([]);
	const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
	const [hasGuessed, setHasGuessed] = useState(false);
	const [isHost, setIsHost] = useState(false); // You can update this based on your user system
	const [submissions, setSubmissions] = useState<{ playerId: string; guess: string }[]>([]);

	const { socket } = useGameSocket({
		onPlayerJoined: (player) => {
			setPlayers((prev) => [...prev, player]);
		},
		onPlayerLeft: (player) => {
			setPlayers((prev) => prev.filter((p) => p.id !== player.id));
		},
	});

	// On first load, fetch room state
	useEffect(() => {
		if (!socket || !roomId) return;

		socket.emit("joinGame", { roomId });

		// Optional: Ask server for current players or song index if needed
	}, [socket, roomId]);

	const handleGuess = (guess: string) => {
		if (!socket || !roomId) return;

		socket.emit("submitGuess", { roomId, songIndex: currentSongIndex, guess });
		setHasGuessed(true);
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-2xl font-bold mb-4">Now Playing: Song #{currentSongIndex + 1}</h1>

			{/* Player Guessing */}
			{!hasGuessed ? (
				<div>
					<h2 className="text-lg mb-2">Who do you think submitted this song?</h2>
					<ul className="space-y-2">
						{players.map((player) => (
							<li key={player.id}>
								<button
									onClick={() => handleGuess(player.id)}
									className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
								>
									{player.name}
								</button>
							</li>
						))}
					</ul>
				</div>
			) : (
				<p className="text-green-700 font-medium">Guess submitted! Waiting for others...</p>
			)}

			{/* Host controls */}
			{isHost && (
				<div className="mt-6">
					<button
						onClick={() => setCurrentSongIndex((prev) => prev + 1)}
						className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800"
					>
						Next Song
					</button>
				</div>
			)}
		</div>
	);
}
