"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";

import type { Member } from "@/types/member";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useJoined } from "@/hooks/useJoined";
import RoomPlayerList from "@/components/shared/RoomPlayerList";

export default function PlayerLobbyView({
	initialRoom,
	currentUserName,
}: {
	initialRoom: Room;
	currentUserName: string;
}) {
	const socket = useSocket();
	const router = useRouter();
	const { room, setRoom, addPlayer, addSong, removeSong } = useRoomState();
	const { submittedPlayers } = useGameRuntime();
	const [joinDenied, setJoinDenied] = useState<null | {
		reason: "kicked" | "closed" | "not_found" | "error";
		at: number;
	}>(null);

	useEffect(() => {
		const read = () => {
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) return setJoinDenied(null);
				const parsed = JSON.parse(raw) as {
					reason: "kicked" | "closed" | "not_found" | "error";
					at: number;
				};
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

	useEffect(() => {
		if (!room || room.code !== initialRoom.code) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

	useJoined(initialRoom.code, currentUserName);

	const socketError = useReconnectNotice();

	useEffect(() => {
		if (!socket) return;

		const onPlayerJoined = (player: Member) => addPlayer(player);
		const onRoomData = (nextRoom: Room) => setRoom(nextRoom);
		const onGameStarted = (nextRoom: Room) => setRoom(nextRoom);
		const onSongAdded = (song: Submission) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);
		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) =>
				prev ? { ...prev, players: prev.players.filter((player) => player.id !== playerId) } : prev
			);
		};

		socket.on("playerJoined", onPlayerJoined);
		socket.on("roomData", onRoomData);
		socket.on("gameStarted", onGameStarted);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("playerLeft", onPlayerLeft);

		return () => {
			socket.off("playerJoined", onPlayerJoined);
			socket.off("roomData", onRoomData);
			socket.off("gameStarted", onGameStarted);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("playerLeft", onPlayerLeft);
		};
	}, [socket, addPlayer, addSong, removeSong, setRoom]);

	const me = useMemo(
		() => room?.players.find((player) => player.name === currentUserName) || null,
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

	if (!room) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-lg">Loading room...</p>
			</div>
		);
	}

	return (
		<div
			className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg to-secondary bg-cover bg-center bg-no-repeat p-8"
			style={{
				backgroundImage: `url(${room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed left-0 top-0 z-50 w-full bg-yellow-300 py-2 text-center text-yellow-900">
					{socketError}
				</div>
			)}
			{joinDenied && (
				<div className="fixed left-0 top-12 z-50 w-full bg-red-500/90 py-2 text-center text-white">
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

			<div className="mx-auto w-full max-w-2xl">
				<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/25 p-6 backdrop-blur-xl">
					<h2 className="text-2xl font-semibold text-text text-center">Waiting for the game to start</h2>
					<div className="rounded-lg border border-border bg-card/50 p-3 text-center">
						<p className="text-xs text-text-muted">Room code</p>
						<p className="text-3xl font-mono font-bold text-secondary">{room.code}</p>
					</div>

					{room.hardcoreRequired && (
						<div className="w-full rounded-lg border border-border bg-card/60 p-3 text-sm text-text">
							Hardcore mode is required in this room.
						</div>
					)}

					<label
						htmlFor="player-hardcore"
						className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/35 px-4 py-3"
					>
						<div className="min-w-0">
							<div className="text-sm font-semibold text-text">Hardcore mode</div>
							<div className="mt-1 text-xs text-text/60">
								{room.hardcoreRequired ? "Locked by host" : "More difficult, higher reward"}
							</div>
						</div>
						<input
							id="player-hardcore"
							type="checkbox"
							className="h-5 w-5 shrink-0 accent-primary"
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
					</label>

					<label
						htmlFor="player-ready"
						className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/35 px-4 py-3"
					>
						<div className="min-w-0">
							<div className="text-sm font-semibold text-text">Ready</div>
							<div className="mt-1 text-xs text-text/60">Let the host know you are ready to play</div>
						</div>
						<input
							id="player-ready"
							type="checkbox"
							className="h-5 w-5 shrink-0 accent-primary"
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
					</label>

					<div className="rounded-xl border border-border bg-card/35 p-4">
						<RoomPlayerList players={room.players} submittedPlayers={submittedPlayers} />
					</div>
				</div>
			</div>
		</div>
	);
}
