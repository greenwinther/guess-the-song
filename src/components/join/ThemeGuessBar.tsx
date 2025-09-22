"use client";
import { FormEvent, useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

export function ThemeGuessBar({ code, playerName }: { code: string; playerName: string }) {
	const socket = useSocket();
	const { room, theme, solvedByTheme, lockedForThisRound, themeRevealed } = useGame();
	const [value, setValue] = useState("");

	const iSolved = useMemo(() => solvedByTheme.includes(playerName), [solvedByTheme, playerName]);
	const iLockedThisRound = useMemo(
		() => lockedForThisRound.includes(playerName),
		[lockedForThisRound, playerName]
	);

	const disabled = !room?.theme || themeRevealed || iSolved || iLockedThisRound;

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (disabled) return;
		const guess = value.trim();
		if (!guess) return;

		socket.emit("THEME_GUESS", { code, playerName, guess });
		setValue(""); // no more this round anyway
	};

	if (!room?.theme) return null;

	return (
		<form onSubmit={onSubmit} className="flex gap-2 items-center">
			<input
				className="input input-bordered flex-1"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={
					themeRevealed
						? "Theme revealed"
						: iSolved
						? "You’ve solved the theme!"
						: iLockedThisRound
						? "You’ve guessed this round"
						: "Guess the theme"
				}
				disabled={disabled}
			/>
			<button className="btn btn-primary" type="submit" disabled={disabled}>
				Lock in theme guess
			</button>
		</form>
	);
}
