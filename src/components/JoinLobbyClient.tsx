"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room } from "@/types/room";
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
	const hasJoined = useRef(false);

	useEffect(() => {
		// seed the entire room (players + songs) in one go
		dispatch({ type: "SET_ROOM", room: initialRoom });

		// 2. Join socket.io room exactly once
		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: currentUserName }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		// 2) Listen for new players
		socket.on("playerJoined", (player: Player) => {
			console.log("👤 [client] playerJoined received:", player);
			dispatch({ type: "ADD_PLAYER", player });
		});

		// 3) Listen for the host's "startGame" broadcast
		socket.on("playSong", () => {
			router.push(`/join/${initialRoom.code}/game?name=${encodeURIComponent(currentUserName)}`);
		});

		return () => {
			socket.off("playerJoined");
			socket.off("playSong");
		};
	}, [socket, dispatch, initialRoom, currentUserName, router]);

	// Render a loading state if for some reason the room isn't set yet
	if (!state.room) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg">Loading lobby…</p>
			</div>
		);
	}

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
