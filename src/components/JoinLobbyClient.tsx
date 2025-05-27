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

		socket.on("songAdded", (song: Song) => {
			dispatch({ type: "ADD_SONG", song });
		});

		socket.on("gameStarted", () => {
			router.push(`/join/${initialRoom.code}/game?name=${encodeURIComponent(currentUserName)}`);
		});

		return () => {
			socket.off("playerJoined");
			socket.off("songAdded");
			socket.off("gameStarted");
		};
	}, [socket, dispatch, initialRoom, currentUserName, router]);

	return (
		<div
			className="min-h-screen bg-cover bg-center p-8"
			style={{ backgroundImage: `url(${state.room?.backgroundUrl})` }}
		>
			<h1 className="text-4xl font-bold">{state.room?.theme}</h1>

			<section className="mt-6">
				<h2 className="text-2xl">Players</h2>
				<ul className="list-disc pl-6">
					{state.room?.players.map((p, i) => (
						<li key={i}>{p.name}</li>
					))}
				</ul>
			</section>

			<section className="mt-6">
				<h2 className="text-2xl">Songs</h2>
				<ul className="list-decimal pl-6">
					{state.room?.songs.map((s) => (
						<li key={s.id}>
							{s.url} <em>({s.submitter})</em>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
