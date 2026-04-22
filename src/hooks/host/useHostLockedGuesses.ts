"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

export function useHostLockedGuesses(currentSongId?: number) {
	const socket = useSocket();
	const [lockedBySong, setLockedBySong] = useState<Map<number, Set<string>>>(
		new Map<number, Set<string>>(),
	);

	const lockedCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		lockedBySong.forEach((names) => {
			names.forEach((name) => {
				counts[name] = (counts[name] || 0) + 1;
			});
		});
		return counts;
	}, [lockedBySong]);

	useEffect(() => {
		if (!socket) return;

		const onPlayerGuessLocked = ({ songId, playerName }: { songId: number; playerName: string }) => {
			setLockedBySong((prev) => {
				const next = new Map(prev);
				const names = new Set<string>(next.get(songId) ?? new Set<string>());
				names.add(playerName);
				next.set(songId, names);
				return next;
			});
		};

		const onPlayerGuessUndo = ({ songId, playerName }: { songId: number; playerName: string }) => {
			setLockedBySong((prev) => {
				const next = new Map(prev);
				const names = new Set<string>(next.get(songId) ?? new Set<string>());
				names.delete(playerName);
				next.set(songId, names);
				return next;
			});
		};

		const onSongFinalized = ({ songId, lockedNames }: { songId: number; lockedNames?: string[] }) => {
			if (!lockedNames?.length) return;
			setLockedBySong((prev) => {
				const next = new Map(prev);
				const names = new Set<string>(next.get(songId) ?? new Set<string>());
				lockedNames.forEach((name) => names.add(name));
				next.set(songId, names);
				return next;
			});
		};

		socket.on("playerGuessLocked", onPlayerGuessLocked);
		socket.on("playerGuessUndo", onPlayerGuessUndo);
		socket.on("songFinalized", onSongFinalized);
		return () => {
			socket.off("playerGuessLocked", onPlayerGuessLocked);
			socket.off("playerGuessUndo", onPlayerGuessUndo);
			socket.off("songFinalized", onSongFinalized);
		};
	}, [socket]);

	const currentLockedNames = Array.from(lockedBySong.get(currentSongId ?? -1) ?? new Set<string>());

	return { currentLockedNames, lockedCounts };
}
