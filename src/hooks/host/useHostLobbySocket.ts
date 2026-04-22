// src/hooks/host/useHostLobbySocket.ts
import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import type { Room } from "@/types/room";
import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";
import { useRoomJoinSocket } from "@/hooks/shared/useRoomJoinSocket";

export function useHostLobbySocket(initialRoom: Room) {
	const socket = useSocket();
	const { setRoom, addPlayer, addSong, removeSong } = useRoomState();
	const { setBgThumbnail } = useGameRuntime();

	// Join as Host (idempotent, handles reconnects)
	useRoomJoinSocket(initialRoom.code, "Host");

	// Seed room + lobby events
	useEffect(() => {
		setRoom(initialRoom);
		if (!socket) return;

		const onPlayerJoined = (player: Member) => addPlayer(player);
		const onRoomData = (room: Room) => setRoom(room);
		const onGameStarted = (room: Room) => {
			setRoom(room);
			setBgThumbnail(null);
		};
		const onSongAdded = (song: Submission) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);
		const onPlayerLeft = (playerId: number) =>
			setRoom((prev) =>
				!prev ? prev : { ...prev, players: prev.players.filter((p) => p.id !== playerId) }
			);

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
	}, [socket, setRoom, setBgThumbnail, addPlayer, addSong, removeSong, initialRoom]);
}
