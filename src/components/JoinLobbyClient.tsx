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
	const { state, dispatch } = useGame();
	const hasJoined = useRef(false);
	const [socketError, setSocketError] = useState<string | null>(null);

	// keep the room code in a ref so our reconnect handler can access it
	const roomCodeRef = useRef(initialRoom.code);

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
			dispatch({ type: "ADD_PLAYER", player });
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
	}, [socket, dispatch, initialRoom, currentUserName, router, state.room?.players]);

	// ─── CONNECTION / RECONNECT EFFECT ─────────────────────────────
	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};

		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit("joinRoom", { code: roomCodeRef.current, name: "Host" }, (ok: boolean) => {
				// you can ignore the result on reconnect
				console.log("re-join ack:", ok);
			});
		};

		// 1) socket-level events
		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		// 2) manager-level events (under the hood)
		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			// teardown socket listeners
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);

			// teardown manager listeners
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

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
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}
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
