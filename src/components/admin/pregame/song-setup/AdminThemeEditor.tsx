// src/components/admin/pregame/song-setup/AdminThemeEditor.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import Input from "@/components/shared/Input";
import clsx from "clsx";

type AdminThemeEditorProps = {
	code?: string;
	themeValue?: string;
	disabled?: boolean;
	compact?: boolean;
	className?: string;
};

export default function AdminThemeEditor({
	code,
	themeValue,
	disabled = false,
	compact = false,
	className,
}: AdminThemeEditorProps) {
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
		if (trimmed === (resolvedTheme ?? "").trim()) return;
		socket.emit("THEME_EDIT", { code: resolvedCode, theme: trimmed });
	}, [disabled, resolvedCode, resolvedTheme, value, socket]);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			setValue(resolvedTheme ?? "");
		}
	};

	if (!resolvedCode) return null;

	if (compact) {
		return (
			<div className={clsx("flex items-center gap-2", className)}>
				<h2 className="shrink-0 text-lg font-semibold text-text sm:text-xl">Theme</h2>
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					size="md"
					variant="default"
					className="w-36 border-border/70 bg-card/25 text-text"
					placeholder="Secret theme"
					disabled={disabled}
				/>
			</div>
		);
	}

	return (
		<div className={clsx("flex w-full items-center gap-3", className)}>
			<label className="shrink-0 text-base font-medium text-text/78">Theme</label>
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				size="md"
				variant="default"
				className="flex-1 bg-card text-text"
				placeholder="Secret theme (e.g., Disney)"
				disabled={disabled}
			/>
		</div>
	);
}
