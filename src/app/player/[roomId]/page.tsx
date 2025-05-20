"use client";

import { useParams } from "next/navigation";

export default function HostLobbyPage() {
	const params = useParams();
	const { roomId } = params;

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-4">Room: {roomId}</h1>
			<p>Waiting for players to join...</p>
			{/* TODO: Show songs, players, controls */}
		</div>
	);
}
