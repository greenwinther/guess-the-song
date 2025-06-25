"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useRef, useState } from "react";
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
	const { room, setRoom, addPlayer, addSong, removeSong, setGameStarted } = useGame();
	const hasJoined = useRef(false);
	const [socketError, setSocketError] = useState<string | null>(null);

	// keep the room code in a ref so our reconnect handler can access it
	const roomCodeRef = useRef(initialRoom.code);
	const playerNameRef = useRef(currentUserName);

	useEffect(() => {
		if (!room) {
			setRoom(initialRoom);
		}

		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: currentUserName }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		socket.on("playerJoined", (player: Player) => {
			console.log("🟢 playerJoined received:", player.name);
			addPlayer(player);
		});

		socket.on("roomData", (room: Room) => {
			setRoom(room);
		});

		socket.on("songAdded", (song: Song) => {
			addSong(song);
		});

		socket.on("songRemoved", ({ songId }) => {
			removeSong(songId);
		});

		socket.on("gameStarted", (room: Room) => {
			setGameStarted(true);
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		});

		return () => {
			socket.off("roomData");
			socket.off("songAdded");
			socket.off("songRemoved");
			socket.off("gameStarted");
			socket.off("playerJoined");
		};
	}, [
		socket,
		initialRoom,
		currentUserName,
		router,
		room,
		setRoom,
		addPlayer,
		addSong,
		removeSong,
		setGameStarted,
	]);

	useEffect(() => {
		console.log(
			"👀 player count changed",
			room?.players.map((p) => p.name)
		);
	}, [room?.players]);

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
					console.log("re-join ack:", ok);
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
					<ul className="space-y-2 list-none">
						{room.players.map((p) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
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
