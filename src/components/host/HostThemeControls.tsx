// src/components/host/HostThemeControls.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export function HostThemeControls() {
	const socket = useSocket();
	const { room, theme } = useGame();

	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(theme ?? "");
	const [clearedOnFocus, setClearedOnFocus] = useState(false);

	useEffect(() => {
		if (!editing) setValue(theme ?? "");
	}, [theme, editing]);

	const handleEdit = useCallback(() => {
		if (!room) return;
		setValue(theme ?? "");
		setClearedOnFocus(false);
		setEditing(true);
	}, [room, theme]);

	const handleSave = useCallback(() => {
		if (!room) return;
		const trimmed = (value ?? "").trim();
		socket.emit("THEME_EDIT", { code: room.code, theme: trimmed });
		setEditing(false);
	}, [room, value, socket]);

	const handleFocus = () => {
		if (!clearedOnFocus) {
			setValue("");
			setClearedOnFocus(true);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			setEditing(false);
			setValue(theme ?? "");
		}
	};

	if (!room) return null;

	return (
		<div className="flex items-center gap-2">
			{!editing ? (
				<Button variant="secondary" size="md" onClick={handleEdit}>
					Edit theme
				</Button>
			) : (
				<>
					<Input
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onFocus={handleFocus}
						onKeyDown={handleKeyDown}
						size="md"
						variant="default"
						className="w-56 bg-card text-text placeholder:text-text-muted"
						placeholder="Secret theme (e.g., Disney)"
					/>
					<Button variant="primary" size="md" onClick={handleSave}>
						Save theme
					</Button>
				</>
			)}
		</div>
	);
}
