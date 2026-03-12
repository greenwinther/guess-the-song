// src/components/control/ThemeEditorControls.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type ThemeEditorControlsProps = {
	code?: string;
	themeValue?: string;
	disabled?: boolean;
};

export function ThemeEditorControls({
	code,
	themeValue,
	disabled = false,
}: ThemeEditorControlsProps) {
	const socket = useSocket();
	const { room } = useRoomState();
	const { theme } = useGameRuntime();
	const resolvedCode = code ?? room?.code;
	const resolvedTheme = themeValue ?? theme;

	const [value, setValue] = useState(resolvedTheme ?? "");

	useEffect(() => {
		setValue(resolvedTheme ?? "");
	}, [resolvedTheme]);

	const handleSave = useCallback(() => {
		if (!resolvedCode || disabled) return;
		const trimmed = (value ?? "").trim();
		socket.emit("THEME_EDIT", { code: resolvedCode, theme: trimmed });
	}, [disabled, resolvedCode, value, socket]);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			setValue(resolvedTheme ?? "");
		}
	};

	if (!resolvedCode) return null;

	return (
		<div className="flex w-full flex-col gap-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold text-text">Theme</h3>
				<p className="text-xs text-text/70">Optional side-game answer players can discover over the round.</p>
			</div>
			<div className="flex flex-col items-start gap-2 sm:flex-row">
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					size="md"
					variant="default"
					className="w-full bg-card text-text placeholder:text-text-muted sm:flex-1"
					placeholder="Secret theme (e.g., Disney)"
					disabled={disabled}
				/>
				<Button
					variant="primary"
					size="md"
					onClick={handleSave}
					disabled={disabled}
					className="relative z-10 w-full shrink-0 sm:w-auto"
				>
					Save theme
				</Button>
			</div>
		</div>
	);
}

