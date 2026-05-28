"use client";
import { FormEvent, useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";

export function PlayerThemeGuessBar({ code, playerName }: { code: string; playerName: string }) {
	const socket = useSocket();
	const { room } = useRoomState();
	const { solvedByTheme, lockedForThisRound, themeRevealed } = useGameRuntime();
	const [value, setValue] = useState("");
	const [lockedGuess, setLockedGuess] = useState("");
	const wasLockedThisRoundRef = useRef(false);

	const iSolved = useMemo(() => solvedByTheme.includes(playerName), [solvedByTheme, playerName]);
	const iLockedThisRound = useMemo(
		() => lockedForThisRound.includes(playerName),
		[lockedForThisRound, playerName]
	);

	useEffect(() => {
		if (iLockedThisRound) {
			wasLockedThisRoundRef.current = true;
			return;
		}

		if (wasLockedThisRoundRef.current) {
			wasLockedThisRoundRef.current = false;
			setLockedGuess("");
			setValue("");
		}
	}, [iLockedThisRound]);

	if (!room?.theme) return null;
	if (room.phase && room.phase !== "GUESSING" && room.phase !== "RECAP") return null;

	// If I solved it: show message instead of the form
	if (iSolved) {
		return (
			<div
				className="px-3 py-2 rounded-lg bg-card border border-border text-text"
				role="status"
				aria-live="polite"
			>
				Good job, you solved the theme.
			</div>
		);
	}

	const hasLockedGuess = Boolean(lockedGuess) || iLockedThisRound;
	const disabled = !room?.theme || themeRevealed || hasLockedGuess;

	const placeholder = themeRevealed
		? "Theme revealed"
		: iLockedThisRound
			? "You've guessed this round"
			: "Guess the theme";

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (disabled) return;
		const guess = value.trim();
		if (!guess) return;

		setLockedGuess(guess);
		setValue(guess);
		socket.emit("THEME_GUESS", { code, playerName, guess });
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") e.preventDefault(); // form handles submit
	};

	return (
		<form onSubmit={onSubmit} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={onKeyDown}
				size="md"
				variant="default"
				className="w-full bg-card text-text placeholder:text-text-muted sm:flex-1"
				placeholder={placeholder}
				disabled={disabled}
				aria-label="Theme guess"
			/>
			<Button type="submit" variant="primary" size="md" disabled={disabled} className="w-full sm:w-auto">
				Lock in theme
			</Button>
		</form>
	);
}
