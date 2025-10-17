// src/components/join/ThemeGuessBar.tsx
"use client";
import { FormEvent, useMemo, useState, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export function ThemeGuessBar({ code, playerName }: { code: string; playerName: string }) {
	const socket = useSocket();
	const { room, theme, solvedByTheme, lockedForThisRound, themeRevealed } = useGame();
	const [value, setValue] = useState("");

	const iSolved = useMemo(() => solvedByTheme.includes(playerName), [solvedByTheme, playerName]);
	const iLockedThisRound = useMemo(
		() => lockedForThisRound.includes(playerName),
		[lockedForThisRound, playerName]
	);

	if (!room?.theme) return null;

	// ✅ If I solved it: show message instead of the form
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

	const disabled = !room?.theme || themeRevealed || iLockedThisRound;

	const placeholder = themeRevealed
		? "Theme revealed"
		: iLockedThisRound
		? "You’ve guessed this round"
		: "Guess the theme";

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (disabled) return;
		const guess = value.trim();
		if (!guess) return;

		socket.emit("THEME_GUESS", { code, playerName, guess });
		setValue(""); // locked for this round anyway
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") e.preventDefault(); // form handles submit
	};

	return (
		<form onSubmit={onSubmit} className="flex gap-2 items-center">
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={onKeyDown}
				size="md"
				variant="default"
				className="flex-1 bg-card text-text placeholder:text-text-muted"
				placeholder={placeholder}
				disabled={disabled}
				aria-label="Theme guess"
			/>
			<Button type="submit" variant="primary" size="md" disabled={disabled}>
				Lock in theme guess
			</Button>
		</form>
	);
}
