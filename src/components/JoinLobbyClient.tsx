"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame, Player, RoomState } from "@/contexts/GameContext";

export default function JoinLobbyClient({ initialRoom }: { initialRoom: RoomState }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [name, setName] = useState<string>("");
	const [joined, setJoined] = useState<boolean>(false);

	// 1) Seed initial data & subscribe to events
	useEffect(() => {
		dispatch({ type: "SET_ROOM", room: initialRoom });
		dispatch({ type: "SET_PLAYERS", players: initialRoom.players });
		dispatch({ type: "SET_SONGS", songs: initialRoom.songs });

		socket.on("playerJoined", (playerName: string) => {
			// we’ll also get a full roomData, but just in case:
			dispatch({ type: "ADD_PLAYER", player: { name: playerName } as Player });
		});

		socket.on("roomData", (fullRoom: RoomState) => {
			dispatch({ type: "SET_PLAYERS", players: fullRoom.players });
			dispatch({ type: "SET_SONGS", songs: fullRoom.songs });
		});

		return () => {
			socket.off("playerJoined");
			socket.off("roomData");
		};
	}, [socket, dispatch, initialRoom]);

	// 2) When the user clicks “Join Lobby”
	const handleJoin = (e: React.FormEvent) => {
		e.preventDefault();
		socket.emit("joinRoom", { code: initialRoom.code, name }, (ok: boolean) => {
			if (ok) {
				setJoined(true);
			} else {
				alert("Failed to join — try again or check the room code.");
			}
		});
	};

	// 3) Render
	if (!joined) {
		// Show the join form
		return (
			<div className="min-h-screen flex items-center justify-center p-8">
				<form onSubmit={handleJoin} className="space-y-4">
					<h1 className="text-2xl font-bold">Join Lobby {initialRoom.code}</h1>
					<input
						type="text"
						placeholder="Your name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						className="input"
					/>
					<button type="submit" className="btn">
						Join Lobby
					</button>
				</form>
			</div>
		);
	}

	// 4) Once joined, show the live lobby
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
