"use client";
// src/components/JoinLobbyClient.tsx

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { Room } from "@/types/room";
import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";
import { useRouter } from "next/navigation";
import PlayerList from "./ui/PlayerList";
import { useReconnectNotice } from "../hooks/useReconnectNotice";
import { useJoined } from "../hooks/useJoined";

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
	const [joinDenied, setJoinDenied] = useState<null | {
		reason: "kicked" | "closed" | "not_found" | "error";
		at: number;
	}>(null);

	useEffect(() => {
		const read = () => {
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) return setJoinDenied(null);
				const parsed = JSON.parse(raw) as { reason: "kicked" | "closed" | "not_found" | "error"; at: number };
				if (!parsed?.reason) return setJoinDenied(null);
				setJoinDenied(parsed);
			} catch {
				setJoinDenied(null);
			}
		};
		read();
		const onEvent = () => read();
		window.addEventListener("gts-join-denied", onEvent);
		window.addEventListener("storage", onEvent);
		return () => {
			window.removeEventListener("gts-join-denied", onEvent);
			window.removeEventListener("storage", onEvent);
		};
	}, []);

	// 1) seed room once
	useEffect(() => {
		if (!room) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

	// 2) ensure we’re joined exactly once per connection (and on reconnect)
	useJoined(initialRoom.code, currentUserName);

	// 3) connection status banner (no emits)
	const socketError = useReconnectNotice();

	// 4) lobby listeners
	useEffect(() => {
		if (!socket) return;

		const onPlayerJoined = (player: Member) => addPlayer(player);
		const onRoomData = (r: Room) => setRoom(r);
		const onSongAdded = (song: Submission) => addSong(song);
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

	const me = useMemo(
		() => room?.players.find((p) => p.name === currentUserName) || null,
		[room?.players, currentUserName]
	);
	const [hardcore, setHardcore] = useState<boolean>(!!me?.hardcore);
	const [ready, setReady] = useState<boolean>(!!me?.ready);

	useEffect(() => {
		setHardcore(!!me?.hardcore);
	}, [me?.hardcore]);

	useEffect(() => {
		setReady(!!me?.ready);
	}, [me?.ready]);

	// If game already started, skip lobby
	useEffect(() => {
		if (!room?.phase) return;
		if (room.phase !== "LOBBY") {
			router.push(`/join/${room.code}/game?name=${encodeURIComponent(currentUserName)}`);
		}
	}, [room?.phase, room?.code, router, currentUserName]);

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
			{joinDenied && (
				<div className="fixed top-12 left-0 w-full bg-red-500/90 text-white text-center py-2 z-50">
					{joinDenied.reason === "kicked" && "You were kicked from this room."}
					{joinDenied.reason === "closed" && "This room is closed."}
					{joinDenied.reason === "not_found" && "Room not found."}
					{joinDenied.reason === "error" && "Unable to join room."}
					<button
						className="ml-3 underline"
						onClick={() => {
							localStorage.removeItem("gts-join-denied");
							router.push("/");
						}}
					>
						Back to start
					</button>
				</div>
			)}
			<div className="max-w-4xl mx-auto bg-card bg-opacity-20 border border-border rounded-2xl backdrop-blur-xl p-8">
				{room.hardcoreRequired && (
					<div className="mb-4 w-full rounded-lg border border-border bg-card/60 p-3 text-sm text-text">
						Hardcore mode is required in this lobby.
					</div>
				)}
				<div className="mb-4 flex items-center gap-3">
					<label className="text-sm text-text/80" htmlFor="player-hardcore">
						Hardcore mode
					</label>
					<input
						id="player-hardcore"
						type="checkbox"
						className="h-4 w-4 accent-primary"
						checked={room.hardcoreRequired ? true : hardcore}
						disabled={room.hardcoreRequired}
						onChange={(e) => {
							const next = e.target.checked;
							setHardcore(next);
							socket.emit("PLAYER_HARDCORE", { code: room.code, hardcore: next }, (ok) => {
								if (!ok) {
									setHardcore(!!me?.hardcore);
									alert("Failed to update hardcore mode");
								}
							});
						}}
					/>
					<span className="text-xs text-text/60">
						{room.hardcoreRequired ? "Locked by host" : "More difficult, higher reward"}
					</span>
				</div>
				<div className="mb-4 flex items-center gap-3">
					<label className="text-sm text-text/80" htmlFor="player-ready">
						Ready
					</label>
					<input
						id="player-ready"
						type="checkbox"
						className="h-4 w-4 accent-primary"
						checked={ready}
						onChange={(e) => {
							const next = e.target.checked;
							setReady(next);
							socket.emit("PLAYER_READY", { code: room.code, ready: next }, (ok) => {
								if (!ok) {
									setReady(!!me?.ready);
									alert("Failed to update ready status");
								}
							});
						}}
					/>
					<span className="text-xs text-text/60">Tell the host you’re ready</span>
				</div>
				<section>
					<h2 className="text-2xl font-semibold text-text-muted mb-4">Players in Lobby</h2>
					<PlayerList players={room.players} submittedPlayers={submittedPlayers} />
				</section>
			</div>
		</div>
	);
}
