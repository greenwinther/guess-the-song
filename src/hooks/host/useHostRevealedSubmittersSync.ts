import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime } from "@/contexts/gameContext";

export function useHostRevealedSubmittersSync() {
	const socket = useSocket();
	const { setRevealedSubmitters } = useGameRuntime();
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
		const onSnapshot = (songIds: number[]) => {
			const merged = Array.from(new Set(songIds));
			ref.current = merged;
			setRevealedSubmitters(merged);
		};

		socket.on("submitterRevealed", onOne);
		socket.on("submitterRevealedAll", onAll);
		socket.on("revealedSubmitters", onSnapshot);

		return () => {
			socket.off("submitterRevealed", onOne);
			socket.off("submitterRevealedAll", onAll);
			socket.off("revealedSubmitters", onSnapshot);
		};
	}, [socket, setRevealedSubmitters]);
}
