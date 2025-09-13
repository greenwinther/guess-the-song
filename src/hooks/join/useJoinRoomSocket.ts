// src/hooks/join/useJoinRoomSocket.ts
import { useEffect } from "react";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { getYouTubeID } from "@/lib/youtube";
import type { Player, Room } from "@/types/room";

export function useJoinRoomSocket(code: string, playerName: string) {
	const socket = useSocket();
	const { setRoom, setGameStarted, setBgThumbnail, setCurrentClip, setScores } = useGame();

	useEffect(() => {
		const onGameStarted = (room: Room) => {
			setRoom(room);
			setGameStarted(true);
			setBgThumbnail(null);
		};

		const onPlayerJoined = (player: Player) => {
			setRoom((prev) =>
				!prev || prev.players.find((p) => p.id === player.id)
					? prev
					: { ...prev, players: [...prev.players, player] }
			);
		};

		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			setCurrentClip({ songId, clipUrl });
			const vidId = getYouTubeID(clipUrl);
			setBgThumbnail(vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null);
		};

		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			setScores(scores);
		};

		socket.on("gameStarted", onGameStarted);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playSong", onPlaySong);
		socket.on("gameOver", onGameOver);

		socket.emit("joinRoom", { code, name: playerName }, (ok: boolean) => {
			if (!ok) console.error("❌ Failed to join room");
		});

		return () => {
			// ✅ cleanup wrapped in a function body
			socket.off("gameStarted", onGameStarted);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playSong", onPlaySong);
			socket.off("gameOver", onGameOver);
		};
	}, [socket, code, playerName, setRoom, setCurrentClip, setBgThumbnail, setScores, setGameStarted]);

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
