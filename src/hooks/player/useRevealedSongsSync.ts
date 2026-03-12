// src/hooks/player/useRevealedSongsSync.ts
import { useEffect, useRef } from "react";
import { useGameRuntime } from "@/contexts/gameContext";
import { useSocket } from "@/contexts/SocketContext";

export function useRevealedSongsSync() {
	const socket = useSocket();
	const { setRevealedSongs } = useGameRuntime();
	const ref = useRef<number[]>([]);

	useEffect(() => {
		const handler = (ids: number[]) => {
			const merged = Array.from(new Set([...ref.current, ...ids]));
			ref.current = merged;
			setRevealedSongs(merged);
		};

		socket.on("revealedSongs", handler);

		return () => {
			// ✅ cleanup must be a function that returns void
			socket.off("revealedSongs", handler);
		};
	}, [socket, setRevealedSongs]);
}
