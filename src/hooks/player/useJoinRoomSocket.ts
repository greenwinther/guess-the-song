// src/hooks/player/useJoinRoomSocket.ts
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useSocket } from "@/contexts/SocketContext";
import { getStoredAvatar } from "@/lib/avatarStorage";
import { getYouTubeID } from "@/lib/youtube";
import type { Room } from "@/types/room";
import type { Member } from "@/types/member";

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
	const { setRoom } = useRoomState();
	const {
		setCurrentClip,
		setBgThumbnail,
		setRevealedSongs,
		setSubmittedPlayers,
		setScores,
	} = useGameRuntime();

	const codeRef = useRef(code);
	const nameRef = useRef(playerName);
	const joinedRef = useRef(false);

	useEffect(() => {
		if (!socket || !code || !playerName || joinedRef.current) return;

		const emitJoinDenied = (reason: "kicked" | "closed" | "not_found" | "error") => {
			try {
				localStorage.setItem(
					"gts-join-denied",
					JSON.stringify({ reason, at: Date.now() })
				);
				window.dispatchEvent(new Event("gts-join-denied"));
			} catch {}
		};

		// listeners FIRST (prevents missing fast server emits)
		const onRoomData = (room: Room) => {
			setRoom(room);
		};

		const onGameStarted = (room: Room) => {
			setRoom(room);
			setBgThumbnail(null);
		};

		const onPlayerJoined = (player: Member) => {
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
		const onJoinDenied = ({ reason }: { reason: "kicked" | "closed" | "not_found" | "error" }) => {
			if (reason === "kicked") {
				toast.error("You were kicked from this room.");
				emitJoinDenied("kicked");
				return;
			}
			if (reason === "closed") {
				toast.error("This room is closed.");
				emitJoinDenied("closed");
				return;
			}
			if (reason === "not_found") {
				toast.error("Room not found.");
				emitJoinDenied("not_found");
				return;
			}
			toast.error("Unable to join room.");
			emitJoinDenied("error");
		};

		const onSocketSynced = () => {
			toast.success("Reconnected.");
		};

		socket.on("playerSubmitted", onPlayerSubmitted);
		socket.on("gameOver", onGameOver);
		socket.on("playerLeft", onPlayerLeft);
		socket.on("joinDenied", onJoinDenied);
		window.addEventListener("gts-socket-synced", onSocketSynced);

		// ---- idempotent join bound to connect ----
		const clientId = getClientId();
		const doJoin = () => {
			if (joinedRef.current) return;
			joinedRef.current = true;
			const avatar = getStoredAvatar();
			socket.emit(
				"joinRoom",
				{
					code: codeRef.current,
					name: nameRef.current,
					clientId,
					avatar: avatar ?? undefined,
				},
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
			socket.off("joinDenied", onJoinDenied);
			window.removeEventListener("gts-socket-synced", onSocketSynced);
			joinedRef.current = false;
		};
	}, [
		socket,
		setRoom,
		setCurrentClip,
		setBgThumbnail,
		setRevealedSongs,
		setSubmittedPlayers,
		setScores,
		code,
		playerName,
	]);
}
