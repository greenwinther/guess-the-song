// src/components/host/HostThemeControls.tsx
"use client";
import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

export function HostThemeControls() {
	const socket = useSocket();
	const { room, theme } = useGame();
	const [value, setValue] = useState(theme ?? "");

	if (!room) return null;

	return (
		<div className="flex gap-2 items-center">
			<input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className="input input-bordered"
				placeholder="Secret theme (e.g., Disney)"
			/>
			<button
				className="btn btn-primary"
				onClick={() => socket.emit("THEME_EDIT", { code: room.code, theme: value })}
			>
				Save theme
			</button>
		</div>
	);
}
