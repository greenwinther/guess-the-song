// src/components/HostLobbyClient.tsx
"use client";

import { useEffect, useRef } from "react";
import SongSubmitForm from "./SongSubmitForm";
import { useSocket } from "@/contexts/SocketContext";
import { Player, RoomState, Song, useGame } from "@/contexts/GameContext";

export default function HostLobbyClient({ initialRoom }: { initialRoom: RoomState }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const hasJoined = useRef(false);

	useEffect(() => {
		// seed context…
		dispatch({ type: "SET_ROOM", room: initialRoom });
		dispatch({ type: "SET_PLAYERS", players: initialRoom.players });
		dispatch({ type: "SET_SONGS", songs: initialRoom.songs });

		// only emit once
		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: "Host" }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		socket.on("playerJoined", (player: Player) => {
			console.log("👤 [client] playerJoined received:", player);
			dispatch({ type: "ADD_PLAYER", player });
		});

		socket.on("songAdded", (song: Song) => {
			console.log("🎵 [client] songAdded received:", song);
			dispatch({ type: "ADD_SONG", song });
		});

		return () => {
			socket.off("playerJoined");
			socket.off("songAdded");
		};
	}, [socket, dispatch, initialRoom]);

	if (!state.room) return <p>Loading lobby…</p>;

	return (
		<div
			className="min-h-screen bg-cover bg-center p-8"
			style={{ backgroundImage: `url(${state.room.backgroundUrl})` }}
		>
			<h1 className="text-4xl font-bold">{state.room.theme}</h1>

			<section className="mt-6">
				<h2 className="text-2xl">Players</h2>
				<ul className="list-disc pl-6">
					{state.room.players.map((p, idx) => (
						<li key={`${p.id}-${idx}`}>{p.name}</li>
					))}
				</ul>
			</section>

			<section className="mt-6">
				<h2 className="text-2xl">Songs</h2>
				<ul className="list-decimal pl-6">
					{state.room.songs.map((s, idx) => (
						<li key={`${s.id}-${idx}`}>
							{s.url} <em>({s.submitter})</em>
						</li>
					))}
				</ul>
			</section>

			<SongSubmitForm code={state.room.code} />
		</div>
	);
}
