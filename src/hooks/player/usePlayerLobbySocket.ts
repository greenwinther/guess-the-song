"use client";

import { useEffect } from "react";

import { useSocket } from "@/contexts/SocketContext";
import { useRoomState } from "@/contexts/gameContext";

import type { Member } from "@/types/member";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

export function usePlayerLobbySocket(initialRoom: Room) {
	const socket = useSocket();
	const { room, setRoom, addPlayer, addSong, removeSong } = useRoomState();

	useEffect(() => {
		if (!room || room.code !== initialRoom.code) setRoom(initialRoom);
	}, [room, initialRoom, setRoom]);

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
}
