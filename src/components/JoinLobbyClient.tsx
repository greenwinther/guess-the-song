"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useRef } from "react";
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
	const hasJoined = useRef(false);

	useEffect(() => {
		// Seed the entire room (players + songs) in one go
		dispatch({ type: "SET_ROOM", room: initialRoom });

		// 1) Join socket.io room exactly once
		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: currentUserName }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		// 2) Register listeners without blocking on hasJoined
		socket.on("playerJoined", (player: Player) => {
			// Deduplicate: only dispatch if that player.id isn’t already in state.room
			if (!state.room?.players.find((p) => p.id === player.id)) {
				dispatch({ type: "ADD_PLAYER", player });
			}
		});

		// 3) Listen for "roomData" → update context
		socket.on("roomData", (room: Room) => {
			dispatch({ type: "SET_ROOM", room });
		});

		// 4) Also listen for songAdded/songRemoved so that any new songs also update context
		socket.on("songAdded", (song: Song) => {
			dispatch({ type: "ADD_SONG", song });
		});
		socket.on("songRemoved", ({ songId }) => {
			dispatch({ type: "REMOVE_SONG", songId });
		});

		// Listen for the gameStarted broadcast
		socket.on("gameStarted", (room: Room) => {
			// Update context with full Room
			dispatch({ type: "START_GAME" });
			// Navigate to the game page
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		});

		return () => {
			socket.off("roomData");
			socket.off("songAdded");
			socket.off("songRemoved");
			socket.off("gameStarted");
			socket.off("playerJoined");
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
			className="
        min-h-screen p-8
        bg-gradient-to-br from-bg to-secondary
        bg-no-repeat bg-cover bg-center
        flex items-center justify-center
      "
			style={{
				backgroundImage: `url(${state.room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-4xl mx-auto bg-card bg-opacity-20 border border-border rounded-2xl backdrop-blur-xl p-8">
				<section>
					<h2 className="text-2xl font-semibold text-text-muted mb-4">Players in Lobby</h2>
					<ul className="space-y-2 list-none">
						{state.room.players.map((p, i) => (
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
