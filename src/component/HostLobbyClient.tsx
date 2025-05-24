// src/components/HostLobbyClient.tsx
"use client";

import { Player, RoomState, Song, useGame } from "@/context/GameContext";
import { useSocket } from "@/context/SocketContext";
import { useEffect } from "react";
import SongSubmitForm from "./SongSubmitForm";

export default function HostLobbyClient({ initialRoom }: { initialRoom: RoomState }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();

	useEffect(() => {
		// Initialize context with server-fetched data
		dispatch({ type: "SET_ROOM", room: initialRoom });
		dispatch({ type: "SET_PLAYERS", players: initialRoom.players });
		dispatch({ type: "SET_SONGS", songs: initialRoom.songs });

		// Listen for real-time updates
		socket.on("playerJoined", (name: string) => {
			dispatch({ type: "ADD_PLAYER", player: { name } });
		});
		socket.on("songAdded", (song: Song) => {
			dispatch({ type: "ADD_SONG", song });
		});
		socket.on("roomData", (fullRoom: RoomState) => {
			dispatch({ type: "SET_PLAYERS", players: fullRoom.players });
			dispatch({ type: "SET_SONGS", songs: fullRoom.songs });
		});

		return () => {
			socket.off("playerJoined");
			socket.off("songAdded");
			socket.off("roomData");
		};
	}, [socket, dispatch, initialRoom]);

	if (!state.room) return <p>Loading…</p>;

	return (
		<div
			className="min-h-screen bg-cover bg-center p-8"
			style={{ backgroundImage: `url(${state.room.backgroundUrl})` }}
		>
			<h1 className="text-4xl font-bold">{state.room.theme}</h1>

			<section>
				<h2 className="text-2xl mt-6">Players</h2>
				<ul className="list-disc pl-6">
					{state.room.players.map((p: Player, i) => (
						<li key={i}>{p.name}</li>
					))}
				</ul>
			</section>

			<section>
				<h2 className="text-2xl mt-6">Songs</h2>
				<ul className="list-decimal pl-6">
					{state.room.songs.map((s: Song) => (
						<li key={s.id}>
							{s.url} <em>({s.submitter})</em>
						</li>
					))}
				</ul>
			</section>

			<SongSubmitForm code={state.room.code} />
		</div>
	);
}
