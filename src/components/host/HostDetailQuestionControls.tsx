// src/components/host/HostDetailQuestionControls.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export function HostDetailQuestionControls() {
	const socket = useSocket();
	const { room } = useGame();

	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(room?.detailQuestion ?? "");
	const [clearedOnFocus, setClearedOnFocus] = useState(false);

	useEffect(() => {
		if (!editing) setValue(room?.detailQuestion ?? "");
	}, [room?.detailQuestion, editing]);

	const handleEdit = useCallback(() => {
		if (!room) return;
		setValue(room.detailQuestion ?? "");
		setClearedOnFocus(false);
		setEditing(true);
	}, [room]);

	const handleSave = useCallback(() => {
		if (!room) return;
		const trimmed = (value ?? "").trim();
		socket.emit("DETAIL_QUESTION", { code: room.code, question: trimmed });
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
			setValue(room?.detailQuestion ?? "");
		}
	};

	if (!room) return null;

	return (
		<div className="flex items-center gap-2">
			{!editing ? (
				<Button variant="secondary" size="md" onClick={handleEdit}>
					Edit question
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
						className="w-64 bg-card text-text placeholder:text-text-muted"
						placeholder="Detail question (e.g., Year released)"
					/>
					<Button variant="primary" size="md" onClick={handleSave}>
						Save
					</Button>
				</>
			)}
		</div>
	);
}
