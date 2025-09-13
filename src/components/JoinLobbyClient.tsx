"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import PlayerList from "./ui/PlayerList";

export default function JoinLobbyClient({
	initialRoom,
	currentUserName,
}: {
	initialRoom: Room;
	currentUserName: string;
}) {
	const socket = useSocket();
	const router = useRouter();
	const {
		room,
		setRoom,
		addPlayer,
		addSong,
		removeSong,
		setGameStarted,
		submittedPlayers,
		setSubmittedPlayers,
	} = useGame();

	const hasJoined = useRef(false);
	const [socketError, setSocketError] = useState<string | null>(null);

	// keep the room code in a ref so our reconnect handler can access it
	const roomCodeRef = useRef(initialRoom.code);
	const playerNameRef = useRef(currentUserName);

	// Seed room once (or whenever initialRoom changes)
	useEffect(() => {
		if (!room) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

	// Socket listeners (no 'room' here)
	useEffect(() => {
		const onPlayerJoined = (player: Player) => addPlayer(player);
		const onRoomData = (room: Room) => setRoom(room);
		const onSongAdded = (song: Song) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);

		const onGameStarted = (room: Room) => {
			// console.log("🎮 gameStarted -> redirect to JoinGame");
			setGameStarted(true);
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		};

		// Attach listeners BEFORE we emit joinRoom
		socket.on("playerJoined", onPlayerJoined);
		socket.on("roomData", onRoomData);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("gameStarted", onGameStarted);

		// Now it’s safe to join (late-join reply won't be missed)
		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: currentUserName }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		return () => {
			socket.off("playerJoined", onPlayerJoined);
			socket.off("roomData", onRoomData);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("gameStarted", onGameStarted);
		};
	}, [
		socket,
		initialRoom,
		currentUserName,
		setRoom,
		addPlayer,
		addSong,
		removeSong,
		setGameStarted,
		router,
	]);

	useEffect(() => {
		socket.on("playerLeft", (playerId: number) => {
			setRoom((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.filter((p) => p.id !== playerId),
				};
			});
		});

		return () => {
			socket.off("playerLeft");
		};
	}, [socket, setRoom]);

	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};

		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit(
				"joinRoom",
				{ code: roomCodeRef.current, name: playerNameRef.current },
				(ok: boolean) => {
					if (!ok) console.error("❌ Failed to re-join");
				}
			);
		};

		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

	useEffect(() => {
		const onGameStarted = (room: Room) => {
			console.log("🎮 Game started event received!", room);
			setGameStarted(true);
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		};

		socket.on("gameStarted", onGameStarted);

		return () => {
			socket.off("gameStarted", onGameStarted);
		};
	}, [socket, router, currentUserName, setGameStarted]);

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
