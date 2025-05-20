//src/app/join/[roomId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Player } from "@/types/game";

export default function PlayerLobbyPage() {
	const { roomId } = useParams();
	const router = useRouter();

	const [players, setPlayers] = useState<Player[]>([]);
	const [name, setName] = useState("");
	const [hasJoined, setHasJoined] = useState(false);

	const { socket } = useGameSocket({
		onPlayerJoined: (player) => {
			setPlayers((prev) => [...prev, player]);
		},
		onPlayerLeft: (player) => {
			setPlayers((prev) => prev.filter((p) => p.id !== player.id));
		},
	});

	useEffect(() => {
		if (!socket || !roomId || !hasJoined) return;

		// Emit joinRoom once name is submitted
		socket.emit("joinRoom", { roomId, name });

		// Fetch current players
		socket.emit("getPlayers", { roomId }, (currentPlayers: Player[]) => {
			setPlayers(currentPlayers);
		});

		// Listen for game start
		socket.on("gameStarted", () => {
			router.push(`/game/${roomId}`);
		});

		return () => {
			socket.off("gameStarted");
		};
	}, [socket, roomId, name, hasJoined, router]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			setHasJoined(true);
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-4">Join Room: {roomId}</h1>

			{!hasJoined ? (
				<form onSubmit={handleSubmit} className="space-y-4">
					<label className="block">
						<span className="text-lg font-medium">Enter your name:</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full p-2 border rounded mt-1"
							required
						/>
					</label>
					<button
						type="submit"
						className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
					>
						Join Game
					</button>
				</form>
			) : (
				<>
					<p className="mb-4">Waiting for host to start the game...</p>

					<h2 className="text-xl mt-6 mb-2">Players in room:</h2>
					<ul>
						{players.map((player) => (
							<li key={player.id} className="mb-1">
								{player.name}
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
