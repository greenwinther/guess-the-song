//src/app/host-room/[roomId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket"; // Assuming you have this
import { Player } from "@/types/game";
import router from "next/router";

export default function HostLobbyPage() {
	const { roomId } = useParams();
	const [players, setPlayers] = useState<Player[]>([]);

	// Centralized socket event handling
	const { socket } = useGameSocket({
		onPlayerJoined: (player) => {
			setPlayers((prev) => {
				if (prev.some((p) => p.id === player.id)) return prev; // Deduplication here
				return [...prev, player];
			});
		},
		onPlayerLeft: (player) => {
			setPlayers((prev) => prev.filter((p) => p.id !== player.id));
		},
	});

	useEffect(() => {
		if (!socket || !roomId) return;

		// Host joins the room
		socket.emit("joinRoom", { roomId });

		// Initial fetch of existing players
		socket.emit("getPlayers", { roomId }, (currentPlayers: Player[]) => {
			setPlayers(currentPlayers);
		});
	}, [socket, roomId]);

	const handleStartGame = () => {
		if (!socket || !roomId) return;

		// Notify all clients
		socket.emit("startGame", { roomId });

		// Navigate host to the game screen
		router.push(`/game/${roomId}`);
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-4">Room: {roomId}</h1>
			<p>Waiting for players to join...</p>

			<h2 className="text-xl mt-6 mb-2">Players:</h2>
			<button
				onClick={handleStartGame}
				className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
			>
				Start Game
			</button>

			<ul>
				{players.map((player) => (
					<li key={player.id} className="mb-1">
						{player.name}
					</li>
				))}
			</ul>
		</div>
	);
}
