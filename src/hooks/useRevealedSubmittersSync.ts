// src/hooks/join/useRevealedSubmittersSync.ts
import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

export function useRevealedSubmittersSync() {
	const socket = useSocket();
	const { setRevealedSubmitters } = useGame();
	const ref = useRef<number[]>([]);

	useEffect(() => {
		const onOne = ({ songId }: { songId: number }) => {
			if (ref.current.includes(songId)) return;
			const merged = [...ref.current, songId];
			ref.current = merged;
			setRevealedSubmitters(merged);
		};

		const onAll = ({ songIds }: { songIds: number[] }) => {
			const merged = Array.from(new Set([...ref.current, ...songIds]));
			ref.current = merged;
			setRevealedSubmitters(merged);
		};

		socket.on("submitterRevealed", onOne);
		socket.on("submitterRevealedAll", onAll);

		return () => {
			socket.off("submitterRevealed", onOne);
			socket.off("submitterRevealedAll", onAll);
		};
	}, [socket, setRevealedSubmitters]);
}
