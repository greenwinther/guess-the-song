"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import PlayerList from "./ui/PlayerList";
import { useReconnectNotice } from "../hooks/useReconnectNotice";
import { useEnsureJoined } from "../hooks/UseEnsureJoined";

export default function JoinLobbyClient({
	initialRoom,
	currentUserName,
}: {
	initialRoom: Room;
	currentUserName: string;
}) {
	const socket = useSocket();
	const router = useRouter();
	const { room, setRoom, addPlayer, addSong, removeSong, setGameStarted, submittedPlayers } = useGame();

	// 1) seed room once
	useEffect(() => {
		if (!room) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

	// 2) ensure we’re joined exactly once per connection (and on reconnect)
	useEnsureJoined(initialRoom.code, currentUserName);

	// 3) connection status banner (no emits)
	const socketError = useReconnectNotice();

	// 4) lobby listeners
	useEffect(() => {
		if (!socket) return;

		const onPlayerJoined = (player: Player) => addPlayer(player);
		const onRoomData = (r: Room) => setRoom(r);
		const onSongAdded = (song: Song) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);

		const onGameStarted = (r: Room) => {
			setGameStarted(true);
			router.push(`/join/${r.code}/game?name=${encodeURIComponent(currentUserName)}`);
		};

		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) =>
				prev ? { ...prev, players: prev.players.filter((p) => p.id !== playerId) } : prev
			);
		};

		socket.on("playerJoined", onPlayerJoined);
		socket.on("roomData", onRoomData);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("gameStarted", onGameStarted);
		socket.on("playerLeft", onPlayerLeft);

		return () => {
			socket.off("playerJoined", onPlayerJoined);
			socket.off("roomData", onRoomData);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("gameStarted", onGameStarted);
			socket.off("playerLeft", onPlayerLeft);
		};
	}, [socket, addPlayer, addSong, removeSong, setGameStarted, setRoom, router, currentUserName]);

	// Render a loading state if for some reason the room isn't set yet
	if (!room) {
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
				backgroundImage: `url(${room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}
			<div className="max-w-4xl mx-auto bg-card bg-opacity-20 border border-border rounded-2xl backdrop-blur-xl p-8">
				<section>
					<h2 className="text-2xl font-semibold text-text-muted mb-4">Players in Lobby</h2>
					<PlayerList players={room.players} submittedPlayers={submittedPlayers} />
				</section>
			</div>
		</div>
	);
}
