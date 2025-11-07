"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import PlayerList from "./ui/PlayerList";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

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

	// seed room once
	useEffect(() => {
		if (!room) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

	const roomCodeRef = useRef(initialRoom.code);
	const playerNameRef = useRef(currentUserName);
	const joinedRef = useRef(false);
	const [socketError, setSocketError] = useState<string | null>(null);

	// Socket listeners (no 'room' here)
	useEffect(() => {
		if (!socket) return;

		const onPlayerJoined = (player: Player) => addPlayer(player);
		const onRoomData = (room: Room) => setRoom(room);
		const onSongAdded = (song: Song) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);

		const onGameStarted = (room: Room) => {
			// console.log("🎮 gameStarted -> redirect to JoinGame");
			setGameStarted(true);
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		};

		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) =>
				prev ? { ...prev, players: prev.players.filter((p) => p.id !== playerId) } : prev
			);
		};

		const onDisconnect = (reason: string) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
			// allow re-join after reconnect
			joinedRef.current = false;
		};

		const onConnect = () => {
			setSocketError(null);
			doJoin();
		};

		// Attach listeners BEFORE we emit joinRoom
		socket.on("playerJoined", onPlayerJoined);
		socket.on("roomData", onRoomData);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("gameStarted", onGameStarted);
		socket.on("playerLeft", onPlayerLeft);
		socket.on("disconnect", onDisconnect);
		socket.on("connect", onConnect);

		// Now it’s safe to join (late-join reply won't be missed)
		const clientId = getClientId();
		function doJoin() {
			if (joinedRef.current) return;
			joinedRef.current = true;
			socket.emit(
				"joinRoom",
				{ code: roomCodeRef.current, name: playerNameRef.current, clientId },
				(ok: boolean) => {
					if (!ok) {
						console.error("❌ Failed to join socket room");
						joinedRef.current = false; // allow retry
					}
				}
			);
		}

		// if already connected when this component mounts (late mount)
		if (socket.connected) doJoin();

		return () => {
			socket.off("playerJoined", onPlayerJoined);
			socket.off("roomData", onRoomData);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("gameStarted", onGameStarted);
			socket.off("playerLeft", onPlayerLeft);
			socket.off("disconnect", onDisconnect);
			socket.off("connect", onConnect);
		};
	}, [socket, addPlayer, addSong, removeSong, setGameStarted, setRoom, router]);

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
