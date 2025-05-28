"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";

export default function JoinLobbyClient({
	initialRoom,
	currentUserName,
}: {
	initialRoom: Room;
	currentUserName: string;
}) {
	const socket = useSocket();
	const router = useRouter();
	const { state, dispatch } = useGame();

	useEffect(() => {
		dispatch({ type: "SET_ROOM", room: initialRoom });
		dispatch({ type: "SET_PLAYERS", players: initialRoom.players });
		dispatch({ type: "SET_SONGS", songs: initialRoom.songs });

		socket.on("playerJoined", (player: Player) => {
			dispatch({ type: "ADD_PLAYER", player });
		});

		socket.on("gameStarted", () => {
			router.push(`/join/${initialRoom.code}/game?name=${encodeURIComponent(currentUserName)}`);
		});

		return () => {
			socket.off("playerJoined");
			socket.off("gameStarted");
		};
	}, [socket, dispatch, initialRoom, currentUserName, router]);

	return (
		<div
			className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary"
			style={{
				backgroundImage: `url(${state.room?.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-4xl mx-auto bg-card bg-opacity-20 border border-border rounded-2xl backdrop-blur-xl p-8">
				<h1 className="text-4xl font-bold text-text mb-6">{state.room?.theme}</h1>

				<section>
					<h2 className="text-2xl font-semibold text-text-muted mb-4">Players in Lobby</h2>
					<ul className="space-y-2 list-none">
						{state.room?.players.map((p, i) => (
							<li key={i} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
}
