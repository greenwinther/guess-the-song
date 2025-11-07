// src/hooks/host/useHostGameSocket.ts
import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { getYouTubeID } from "@/lib/youtube";
import type { Player, Room } from "@/types/room";
import { useEnsureJoined } from "../UseEnsureJoined";

/**
 * Host-side game socket wiring:
 * - gameStarted → seed room + reset bg
 * - playSong → set clip, currentSong, bg thumbnail, start playing
 * - playerJoined/Left → keep player list fresh
 * - playerSubmitted → collect submitters
 * - gameOver → set final scores
 */
export function useHostGameSocket(code: string) {
	const socket = useSocket();
	useEnsureJoined(code, "Host");
	const {
		room,
		setRoom,
		setGameStarted,
		setCurrentClip,
		setScores,
		setRevealedSongs,
		addPlayer,
		setCurrentSong,
		setSubmittedPlayers,
		setBgThumbnail,
	} = useGame();

	// gameStarted
	useEffect(() => {
		const onGameStarted = (roomData: Room) => {
			setRoom(roomData);
			setGameStarted(true);
			setBgThumbnail(null);
		};
		socket.on("gameStarted", onGameStarted);
		return () => {
			socket.off("gameStarted", onGameStarted);
		};
	}, [socket, setRoom, setGameStarted, setBgThumbnail]);

	// playSong → set current clip, currentSong, bg thumb
	useEffect(() => {
		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			setCurrentClip({ songId, clipUrl });
			const song = room?.songs.find((x) => x.id === songId) || null;
			setCurrentSong(song);

			const vidId = getYouTubeID(clipUrl);
			setBgThumbnail(vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null);
		};
		socket.on("playSong", onPlaySong);
		return () => {
			socket.off("playSong", onPlaySong);
		};
	}, [socket, room, setCurrentClip, setCurrentSong, setBgThumbnail]);

	// playerJoined / playerLeft
	useEffect(() => {
		const onPlayerJoined = (player: Player) => addPlayer(player);
		const onPlayerLeft = (playerId: number) => {
			setRoom((prev) => {
				if (!prev) return prev;
				return { ...prev, players: prev.players.filter((p) => p.id !== playerId) };
			});
		};

		socket.on("playerJoined", onPlayerJoined);
		socket.on("playerLeft", onPlayerLeft);

		return () => {
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playerLeft", onPlayerLeft);
		};
	}, [socket, addPlayer, setRoom]);

	// playerSubmitted → track submitted players
	useEffect(() => {
		const onPlayerSubmitted = ({ playerName }: { playerName: string }) => {
			setSubmittedPlayers((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};
		socket.on("playerSubmitted", onPlayerSubmitted);
		return () => {
			socket.off("playerSubmitted", onPlayerSubmitted);
		};
	}, [socket, setSubmittedPlayers]);

	// gameOver → final scores
	useEffect(() => {
		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			setScores(scores);
		};
		socket.on("gameOver", onGameOver);
		return () => {
			socket.off("gameOver", onGameOver);
		};
	}, [socket, setScores]);
}
