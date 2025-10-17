// src/hooks/useThemeSockets.ts
"use client";
import { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

export function useThemeSockets() {
	const socket = useSocket();
	const { setTheme, setSolvedByTheme, setLockedForThisRound, setThemeHint, setThemeRevealed } = useGame();

	useEffect(() => {
		if (!socket) return;

		const onUpdated = ({ theme }: { theme?: string }) => {
			setTheme(theme ?? "");
			setSolvedByTheme([]);
			setLockedForThisRound([]);
			setThemeHint(null);
			setThemeRevealed(false);
		};

		const onSolved = ({ playerName }: { playerName: string }) => {
			setSolvedByTheme((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};

		const onRoundReset = () => setLockedForThisRound([]);

		const onGuessResult = ({
			playerName,
			correct,
			lockedForRound,
		}: {
			playerName: string;
			correct: boolean;
			lockedForRound?: boolean;
		}) => {
			if (!correct && lockedForRound) {
				setLockedForThisRound((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
			}
		};

		const onGuessedThisRound = ({ playerName }: { playerName: string }) => {
			setLockedForThisRound((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};

		const onHint = ({ obfuscated }: { obfuscated: string }) => setThemeHint(obfuscated);
		const onRevealed = () => setThemeRevealed(true);

		socket.on("THEME_UPDATED", onUpdated);
		socket.on("THEME_SOLVED", onSolved);
		socket.on("THEME_ROUND_RESET", onRoundReset);
		socket.on("THEME_GUESS_RESULT", onGuessResult);
		socket.on("THEME_HINT_READY", onHint);
		socket.on("THEME_REVEALED", onRevealed);
		socket.on("THEME_GUESSED_THIS_ROUND", onGuessedThisRound);

		return () => {
			socket.off("THEME_UPDATED", onUpdated);
			socket.off("THEME_SOLVED", onSolved);
			socket.off("THEME_ROUND_RESET", onRoundReset);
			socket.off("THEME_GUESS_RESULT", onGuessResult);
			socket.off("THEME_HINT_READY", onHint);
			socket.off("THEME_REVEALED", onRevealed);
			socket.off("THEME_GUESSED_THIS_ROUND", onGuessedThisRound);
		};
	}, [
		socket,
		setTheme,
		setSolvedByTheme,
		setLockedForThisRound, // ← keep once
		setThemeHint,
		setThemeRevealed,
	]);
}
