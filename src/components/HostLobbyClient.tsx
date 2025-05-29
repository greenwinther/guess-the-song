"use client";
// src/components/HostLobbyClient.tsx

import { useEffect, useRef } from "react";
import SongSubmitForm from "./SongSubmitForm";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

export default function HostLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	const router = useRouter();
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

	const startGame = () => {
		// pick first song in playlist
		const first = state.room!.songs[0];
		if (!first) return alert("Add at least one song before starting!");

		socket.emit(
			"startGame",
			{ code: initialRoom.code, songId: first.id },
			(res: { success: boolean; error?: string }) => {
				if (!res.success) {
					alert(res.error);
				} else {
					// now that server has broadcast gameStarted+roundStarted,
					// navigate host into the game page:
					router.push(`/host/${initialRoom.code}/game`);
				}
			}
		);
	};

	return (
		<div
			className="
    min-h-screen p-8 
    bg-gradient-to-br from-bg to-secondary 
    bg-no-repeat bg-cover bg-center
  "
			style={{
				backgroundImage: `url(${state.room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/* Sidebar */}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border flex flex-col items-center">
					<h1 className="text-3xl font-bold text-text mb-4">
						Guess <span className="text-secondary underline decoration-highlight">the</span> Song
					</h1>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg p-4 text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{state.room.code}</p>
					</div>
					<p className="text-text-muted mb-4">Waiting for players...</p>
					<ul className="space-y-2 w-full">
						{state.room.players.map((p) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</aside>

				{/* Main panel */}
				<main className="flex-1 p-8 space-y-6">
					<h2 className="text-3xl font-semibold text-text">Song Setup</h2>

					<SongSubmitForm code={state.room.code} />

					{/* Song list */}
					<div className="bg-card bg-opacity-50 border border-border rounded-lg divide-y divide-border overflow-hidden">
						{state.room.songs.map((s, i) => (
							<div
								key={s.id}
								className="flex items-center justify-between px-4 py-3 hover:bg-card hover:bg-opacity-30 transition"
							>
								<div>
									<span className="inline-block w-6 h-6 mr-3 text-text-muted font-semibold text-center">
										{i + 1}
									</span>
									<span className="font-semibold text-text">{s.title}</span>
									<div className="text-text-muted text-sm">{s.submitter}</div>
								</div>
							</div>
						))}
					</div>

					<Button onClick={startGame} variant="primary" size="lg" className="w-full">
						Start Game
					</Button>
				</main>
			</div>
		</div>
	);
}
