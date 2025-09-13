// src/hooks/join/useJoinRoomSocket.ts
import { useEffect, useRef } from "react";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { getYouTubeID } from "@/lib/youtube";
import type { Player, Room } from "@/types/room";

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
		// listeners FIRST (prevents missing fast server emits)
		const onRoomData = (room: Room) => {
			setRoom(room);
			// no need to flip gameStarted here; this is just the room snapshot
		};

		const onGameStarted = (room: Room) => {
			// late joiners will get this immediately if the game already started
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

		const onPlayerSubmitted = ({ playerName }: { playerName: string }) => {
			setSubmittedPlayers((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};

		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			setScores(scores);
		};

		socket.on("roomData", onRoomData);
		socket.on("gameStarted", onGameStarted);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playSong", onPlaySong);
		socket.on("revealedSongs", onRevealed);
		socket.on("playerSubmitted", onPlayerSubmitted);
		socket.on("gameOver", onGameOver);

		// join once (initial + on reconnect)
		const join = () => {
			socket.emit("joinRoom", { code: codeRef.current, name: nameRef.current }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join room");
			});
			joinedRef.current = true;
		};

		if (socket.connected && !joinedRef.current) join();
		const onConnect = () => join();

		socket.on("connect", onConnect);

		return () => {
			// ✅ cleanup wrapped in a function body
			socket.off("roomData", onRoomData);
			socket.off("gameStarted", onGameStarted);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playSong", onPlaySong);
			socket.off("revealedSongs", onRevealed);
			socket.off("playerSubmitted", onPlayerSubmitted);
			socket.off("gameOver", onGameOver);
			socket.off("connect", onConnect);
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
	]);

	// separate effect for playerLeft
	useEffect(() => {
		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) =>
				prev ? { ...prev, players: prev.players.filter((p) => p.id !== playerId) } : prev
			);
		};

		socket.on("playerLeft", onPlayerLeft);

		return () => {
			// ✅ same fix here
			socket.off("playerLeft", onPlayerLeft);
		};
	}, [socket, setRoom]);
}
