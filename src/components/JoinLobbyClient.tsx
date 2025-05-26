"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";

export default function JoinLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();

	// 1) Seed initial data & subscribe to events
	useEffect(() => {
		dispatch({ type: "SET_ROOM", room: initialRoom });
		dispatch({ type: "SET_PLAYERS", players: initialRoom.players });
		dispatch({ type: "SET_SONGS", songs: initialRoom.songs });

		socket.on("playerJoined", (player: Player) => {
			console.log("👤 [client] playerJoined received:", player);
			dispatch({ type: "ADD_PLAYER", player });
		});

		socket.on("songAdded", (song: Song) => {
			console.log("🎵 [client] songAdded received:", song);
			dispatch({ type: "ADD_SONG", song });
		});

		return () => {
			socket.off("songAdded");
			socket.off("playerJoined");
		};
	}, [socket, dispatch, initialRoom]);

	// 2) Once joined, show the live lobby
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
