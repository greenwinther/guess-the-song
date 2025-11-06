// src/hooks/join/useJoinRoomSocket.ts
import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { getYouTubeID } from "@/lib/youtube";
import type { Player, Room } from "@/types/room";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

export function useJoinRoomSocket(code: string, playerName: string) {
	const socket = useSocket();
	const {
		setRoom,
		setGameStarted,
		setCurrentClip,
		setBgThumbnail,
		setRevealedSongs,
		setSubmittedPlayers,
		setScores,
	} = useGame();

	const codeRef = useRef(code);
	const nameRef = useRef(playerName);
	const joinedRef = useRef(false);

	useEffect(() => {
		if (!socket || !code || !playerName || joinedRef.current) return;

		// listeners FIRST (prevents missing fast server emits)
		const onRoomData = (room: Room) => {
			setRoom(room);
		};

		const onGameStarted = (room: Room) => {
			setRoom(room);
			setGameStarted(true);
			setBgThumbnail(null);
		};

		const onPlayerJoined = (player: Player) => {
			if (player.name === nameRef.current) return;
			setRoom((prev) =>
				!prev || prev.players.some((p) => p.id === player.id)
					? prev
					: { ...prev, players: [...prev.players, player] }
			);
		};

		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			setCurrentClip({ songId, clipUrl });
			const vidId = getYouTubeID(clipUrl);
			setBgThumbnail(vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null);
		};

		const onRevealed = (ids: number[]) => setRevealedSongs(ids);

		const onPlayerSubmitted = ({ playerName }: { playerName: string }) =>
			setSubmittedPlayers((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));

		const onGameOver = ({ scores }: { scores: Record<string, number> }) => setScores(scores);

		const onPlayerLeft = (playerId: number) =>
			setRoom((prev) =>
				prev ? { ...prev, players: prev.players.filter((p) => p.id !== playerId) } : prev
			);

		socket.on("roomData", onRoomData);
		socket.on("gameStarted", onGameStarted);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playSong", onPlaySong);
		socket.on("revealedSongs", onRevealed);
		socket.on("playerSubmitted", onPlayerSubmitted);
		socket.on("gameOver", onGameOver);
		socket.on("playerLeft", onPlayerLeft);

		// ---- idempotent join bound to connect ----
		const clientId = getClientId();
		const doJoin = () => {
			if (joinedRef.current) return;
			joinedRef.current = true;
			socket.emit(
				"joinRoom",
				{ code: codeRef.current, name: nameRef.current, clientId },
				(ok: boolean) => {
					if (!ok) joinedRef.current = false;
				}
			);
		};

		if (socket.connected) doJoin();
		socket.on("connect", doJoin);

		return () => {
			socket.off("connect", doJoin);
			socket.off("roomData", onRoomData);
			socket.off("gameStarted", onGameStarted);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playSong", onPlaySong);
			socket.off("revealedSongs", onRevealed);
			socket.off("playerSubmitted", onPlayerSubmitted);
			socket.off("gameOver", onGameOver);
			socket.off("playerLeft", onPlayerLeft);
			joinedRef.current = false;
		};
	}, [
		socket,
		setRoom,
		setGameStarted,
		setCurrentClip,
		setBgThumbnail,
		setRevealedSongs,
		setSubmittedPlayers,
		setScores,
		code,
		playerName,
	]);
}
