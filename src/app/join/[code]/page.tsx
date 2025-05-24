// src/app/join/[roomId]/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function JoinLobbyPage({ params }: { params: { roomId: string } }) {
	const { roomId } = params;
	const search = useSearchParams();
	const name = search.get("name") || "";

	const [players, setPlayers] = useState<string[]>([]);

	useEffect(() => {
		// TODO: fetch initial player list or subscribe via socket
		setPlayers([name]);
	}, [name]);

	return (
		<main className="min-h-screen p-8 bg-gray-50">
			<header className="mb-6 text-center">
				<h1 className="text-3xl font-bold">Joining Lobby: {roomId}</h1>
			</header>

			<section className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
				<h2 className="text-2xl mb-4">Players</h2>
				<ul className="list-disc list-inside space-y-2">
					{players.map((p, i) => (
						<li key={i}>{p}</li>
					))}
				</ul>
			</section>
		</main>
	);
}
