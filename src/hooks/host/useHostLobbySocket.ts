// src/hooks/host/useHostLobbySocket.ts
import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import type { Player, Room, Song } from "@/types/room";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

/**
 * Boots the host lobby:
 * - seeds the room into context,
 * - joins the socket room as "Host",
 * - wires lobby events: playerJoined, songAdded, songRemoved, playerLeft.
 */
export function useHostLobbySocket(initialRoom: Room) {
	const socket = useSocket();
	const { setRoom, addPlayer, addSong, removeSong } = useGame();
	const joinedRef = useRef(false);

	// Seed room + join as Host + core lobby events
	useEffect(() => {
		setRoom(initialRoom);
		if (!socket) return;

		const clientId = getClientId();

		const doJoin = () => {
			if (joinedRef.current) return;
			joinedRef.current = true;
			socket.emit("joinRoom", { code: initialRoom.code, name: "Host", clientId }, (ok: boolean) => {
				if (!ok) joinedRef.current = false;
			});
		};

		// join nu om redan connected, annars vid connect
		if (socket.connected) doJoin();
		socket.on("connect", doJoin);

		const onPlayerJoined = (player: Player) => addPlayer(player);
		const onSongAdded = (song: Song) => addSong(song);
		const onSongRemoved = ({ songId }: { songId: number }) => removeSong(songId);

		socket.on("playerJoined", onPlayerJoined);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);

		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) =>
				!prev ? prev : { ...prev, players: prev.players.filter((p) => p.id !== playerId) }
			);
		};
		socket.on("playerLeft", onPlayerLeft);

		return () => {
			socket.off("connect", doJoin);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("playerLeft", onPlayerLeft);
			joinedRef.current = false;
		};
	}, [socket, setRoom, addPlayer, addSong, removeSong, initialRoom]);

	// Keep room players fresh when someone leaves
	useEffect(() => {
		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) => {
				if (!prev) return prev;
				return { ...prev, players: prev.players.filter((p) => p.id !== playerId) };
			});
		};

		socket.on("playerLeft", onPlayerLeft);
		return () => {
			socket.off("playerLeft", onPlayerLeft);
		};
	}, [socket, setRoom]);
}
