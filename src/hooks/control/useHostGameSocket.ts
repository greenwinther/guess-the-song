// src/hooks/control/useHostGameSocket.ts
import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { getYouTubeID } from "@/lib/youtube";
import type { Room } from "@/types/room";
import type { Member } from "@/types/member";
import { useJoined } from "../useJoined";

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
	useJoined(code, "Host");
	const requestedRef = useRef(false);
	const { room, setRoom, addPlayer } = useRoomState();
	const {
		setCurrentClip,
		setScores,
		setCurrentSong,
		setSubmittedPlayers,
		setBgThumbnail,
	} = useGameRuntime();

	// gameStarted
	useEffect(() => {
		const onGameStarted = (roomData: Room) => {
			setRoom(roomData);
			setBgThumbnail(null);
		};
		socket.on("gameStarted", onGameStarted);
		const onRoomData = (roomData: Room) => {
			setRoom(roomData);
		};
		socket.on("roomData", onRoomData);
		return () => {
			socket.off("gameStarted", onGameStarted);
			socket.off("roomData", onRoomData);
		};
	}, [socket, setRoom, setBgThumbnail]);

	// Ensure we get a fresh room snapshot after listeners are attached
	useEffect(() => {
		if (!socket) return;
		const request = () => {
			if (requestedRef.current) return;
			requestedRef.current = true;
			socket.emit("joinRoom", { code, name: "Host" }, () => {});
		};
		if (socket.connected) request();
		socket.on("connect", request);
		return () => {
			socket.off("connect", request);
			requestedRef.current = false;
		};
	}, [socket, code]);

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

	// songChanged -> sync currentSong from active id
	useEffect(() => {
		const onSongChanged = ({ songId }: { songId: number | null }) => {
			const nextSong = songId ? room?.songs.find((x) => x.id === songId) || null : null;
			setCurrentSong(nextSong);
			if (!songId) setCurrentClip(null);
		};
		socket.on("songChanged", onSongChanged);
		return () => {
			socket.off("songChanged", onSongChanged);
		};
	}, [socket, room, setCurrentSong, setCurrentClip]);

	// playerJoined / playerLeft
	useEffect(() => {
		const onPlayerJoined = (player: Member) => addPlayer(player);
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
